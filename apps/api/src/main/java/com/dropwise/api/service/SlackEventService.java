package com.dropwise.api.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.dropwise.api.model.MessageCorrelation;
import com.dropwise.api.model.TicketLinkage;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class SlackEventService {
    private static final long SLACK_REQUEST_MAX_AGE_SECONDS = 300L;

    private final AWSService awsService;
    private final ConnectwiseService connectwiseService;
    private final ObjectMapper objectMapper;
    private final String signingSecret;

    public SlackEventService(
        AWSService awsService,
        ConnectwiseService connectwiseService,
        @Value("${slack.signing-secret:${SLACK_SIGNING_SECRET:}}") String signingSecret
    ) {
        this.awsService = awsService;
        this.connectwiseService = connectwiseService;
        this.objectMapper = new ObjectMapper();
        this.signingSecret = signingSecret;
    }

    public ResponseEntity<String> handleEvent(String slackSignature, String slackTimestamp, String rawBody) {
        if (!isSlackRequestAuthentic(slackTimestamp, slackSignature, rawBody)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Slack signature");
        }

        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(rawBody, new TypeReference<Map<String, Object>>() {});
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body("Invalid JSON payload");
        }

        if ("url_verification".equals(asString(payload.get("type")))) {
            return ResponseEntity.ok(asString(payload.get("challenge")));
        }

        if (!"event_callback".equals(asString(payload.get("type")))) {
            return ResponseEntity.ok("OK");
        }

        String tenantId = resolveTenantId(payload);
        Object eventObject = payload.get("event");
        if (!(eventObject instanceof Map<?, ?> rawEvent)) {
            return ResponseEntity.ok("OK");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> event = (Map<String, Object>) rawEvent;
        if (!"message".equals(asString(event.get("type")))) {
            return ResponseEntity.ok("OK");
        }
        if (event.get("bot_id") != null || event.get("bot_profile") != null) {
            return ResponseEntity.ok("Ignored bot event");
        }

        String subtype = asString(event.get("subtype"));
        if (subtype != null) {
            return ResponseEntity.ok("Ignored subtype");
        }

        String threadTs = asString(event.get("thread_ts"));
        String messageTs = asString(event.get("ts"));
        if (!StringUtils.hasText(threadTs) || !StringUtils.hasText(messageTs) || threadTs.equals(messageTs)) {
            return ResponseEntity.ok("OK");
        }

        String text = asString(event.get("text"));
        if (!StringUtils.hasText(text)) {
            return ResponseEntity.ok("Ignored empty reply");
        }

        Optional<TicketLinkage> linkage = awsService.findTicketLinkageByThreadId(tenantId, "slack", threadTs);
        if (linkage.isEmpty()) {
            return ResponseEntity.ok("No matching linkage");
        }

        TicketLinkage ticketLinkage = linkage.get();
        if (isSlackMessageAlreadyCorrelated(ticketLinkage, messageTs)) {
            return ResponseEntity.ok("Duplicate reply ignored");
        }

        try {
            String providerItemId = connectwiseService.addSlackReplyAsTimeEntry(
                tenantId,
                ticketLinkage.getSourceTicketId(),
                text
            );

            MessageCorrelation correlation = new MessageCorrelation();
            correlation.setProviderItemId(StringUtils.hasText(providerItemId) ? providerItemId : "slack:" + messageTs);
            correlation.setDestinationMessageId(messageTs);
            ticketLinkage.getMessageCorrelations().add(correlation);
            awsService.saveTicketLinkage(ticketLinkage);
        } catch (Exception exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack reply writeback failed: " + exception.getMessage()
            );
        }

        return ResponseEntity.ok("OK");
    }

    private String resolveTenantId(Map<String, Object> payload) {
        String workspaceId = asString(payload.get("team_id"));
        if (!StringUtils.hasText(workspaceId)) {
            Object eventObject = payload.get("event");
            if (eventObject instanceof Map<?, ?> event) {
                workspaceId = asString(event.get("team"));
            }
        }

        if (!StringUtils.hasText(workspaceId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Slack event missing workspace id.");
        }

        return awsService.resolveTenantIdBySlackWorkspaceId(workspaceId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No tenant found for Slack workspace."));
    }

    private boolean isSlackMessageAlreadyCorrelated(TicketLinkage linkage, String messageTs) {
        if (linkage.getMessageCorrelations() == null || linkage.getMessageCorrelations().isEmpty()) {
            return false;
        }

        for (MessageCorrelation correlation : linkage.getMessageCorrelations()) {
            if (messageTs.equals(correlation.getDestinationMessageId())) {
                return true;
            }
        }
        return false;
    }

    private boolean isSlackRequestAuthentic(String timestampHeader, String signatureHeader, String rawBody) {
        String normalizedSigningSecret = normalize(signingSecret);
        if (!StringUtils.hasText(normalizedSigningSecret)) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Missing Slack signing secret.");
        }
        if (!StringUtils.hasText(timestampHeader) || !StringUtils.hasText(signatureHeader) || rawBody == null) {
            return false;
        }

        long requestTimestamp;
        try {
            requestTimestamp = Long.parseLong(timestampHeader);
        } catch (NumberFormatException exception) {
            return false;
        }

        long now = Instant.now().getEpochSecond();
        if (Math.abs(now - requestTimestamp) > SLACK_REQUEST_MAX_AGE_SECONDS) {
            return false;
        }

        String baseString = "v0:" + timestampHeader + ":" + rawBody;
        String expectedSignature = "v0=" + hmacSha256Hex(baseString, normalizedSigningSecret);
        return MessageDigest.isEqual(
            expectedSignature.getBytes(StandardCharsets.UTF_8),
            signatureHeader.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String hmacSha256Hex(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return toHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to compute Slack signature.", exception);
        }
    }

    private String toHex(byte[] bytes) {
        StringBuilder builder = new StringBuilder(bytes.length * 2);
        for (byte currentByte : bytes) {
            builder.append(String.format("%02x", currentByte));
        }
        return builder.toString();
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        String stringValue = String.valueOf(value).trim();
        return stringValue.isEmpty() ? null : stringValue;
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}
