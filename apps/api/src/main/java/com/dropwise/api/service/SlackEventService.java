package com.dropwise.api.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private static final Logger log = LoggerFactory.getLogger(SlackEventService.class);
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
            log.warn("Rejected Slack event with invalid signature or timestamp.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Slack signature");
        }

        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(rawBody, new TypeReference<Map<String, Object>>() {});
        } catch (Exception exception) {
            log.warn("Rejected Slack event with invalid JSON payload.", exception);
            return ResponseEntity.badRequest().body("Invalid JSON payload");
        }

        String payloadType = asString(payload.get("type"));
        if ("url_verification".equals(payloadType)) {
            log.info("Received Slack URL verification challenge.");
            return ResponseEntity.ok(asString(payload.get("challenge")));
        }

        if (!"event_callback".equals(payloadType)) {
            log.info("Ignoring Slack payload type {}.", payloadType);
            return ResponseEntity.ok("OK");
        }

        String tenantId = resolveTenantId(payload);
        Object eventObject = payload.get("event");
        if (!(eventObject instanceof Map<?, ?> rawEvent)) {
            log.info("Ignoring Slack event callback without event object for tenant {}.", tenantId);
            return ResponseEntity.ok("OK");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> event = (Map<String, Object>) rawEvent;
        String eventType = asString(event.get("type"));
        if (!"message".equals(eventType)) {
            log.info("Ignoring Slack event type {} for tenant {}.", eventType, tenantId);
            return ResponseEntity.ok("OK");
        }

        String subtype = asString(event.get("subtype"));
        String channelId = asString(event.get("channel"));
        String userId = asString(event.get("user"));
        String threadTs = asString(event.get("thread_ts"));
        String messageTs = asString(event.get("ts"));
        log.info(
            "Received Slack message event tenantId={} channel={} ts={} threadTs={} user={} subtype={} bot={}.",
            tenantId,
            channelId,
            messageTs,
            threadTs,
            userId,
            subtype,
            event.get("bot_id") != null || event.get("bot_profile") != null
        );

        if (event.get("bot_id") != null || event.get("bot_profile") != null) {
            log.info("Ignoring Slack bot message tenantId={} channel={} ts={} threadTs={}.", tenantId, channelId, messageTs, threadTs);
            return ResponseEntity.ok("Ignored bot event");
        }

        String lookupThreadTs = StringUtils.hasText(threadTs) ? threadTs : messageTs;
        if (!StringUtils.hasText(lookupThreadTs) || !StringUtils.hasText(messageTs)) {
            log.info("Ignoring Slack message without usable ts tenantId={} channel={} ts={} threadTs={}.", tenantId, channelId, messageTs, threadTs);
            return ResponseEntity.ok("OK");
        }

        String text = asString(event.get("text"));
        if (!StringUtils.hasText(text)) {
            log.info("Ignoring Slack message with empty text tenantId={} channel={} ts={} threadTs={} subtype={}.", tenantId, channelId, messageTs, threadTs, subtype);
            return ResponseEntity.ok("Ignored empty reply");
        }

        log.info("Looking up ticket linkage for Slack thread tenantId={} channel={} lookupThreadTs={}.", tenantId, channelId, lookupThreadTs);
        Optional<TicketLinkage> linkage = awsService.findTicketLinkageByThreadId(tenantId, "slack", lookupThreadTs);
        if (linkage.isEmpty()) {
            log.info("No ticket linkage found for Slack thread tenantId={} channel={} lookupThreadTs={} messageTs={}.", tenantId, channelId, lookupThreadTs, messageTs);
            return ResponseEntity.ok("No matching linkage");
        }

        TicketLinkage ticketLinkage = linkage.get();
        if (isSlackMessageAlreadyCorrelated(ticketLinkage, messageTs)) {
            log.info(
                "Ignoring already-correlated Slack reply tenantId={} ticketId={} channel={} messageTs={}.",
                tenantId,
                ticketLinkage.getSourceTicketId(),
                channelId,
                messageTs
            );
            return ResponseEntity.ok("Duplicate reply ignored");
        }

        try {
            log.info(
                "Writing Slack reply to ConnectWise tenantId={} ticketId={} channel={} messageTs={}.",
                tenantId,
                ticketLinkage.getSourceTicketId(),
                channelId,
                messageTs
            );
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
            log.info(
                "Saved Slack reply correlation tenantId={} ticketId={} providerItemId={} messageTs={}.",
                tenantId,
                ticketLinkage.getSourceTicketId(),
                correlation.getProviderItemId(),
                messageTs
            );
        } catch (Exception exception) {
            log.warn(
                "Slack reply writeback failed tenantId={} ticketId={} channel={} messageTs={}.",
                tenantId,
                ticketLinkage.getSourceTicketId(),
                channelId,
                messageTs,
                exception
            );
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
