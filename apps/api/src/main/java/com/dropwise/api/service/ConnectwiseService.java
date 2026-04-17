package com.dropwise.api.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.dropwise.api.model.ActivityEvent;
import com.dropwise.api.model.ConnectwiseTicketResponse;
import com.dropwise.api.model.TicketSnapshot;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ConnectwiseService {

    private static final Logger log = LoggerFactory.getLogger(ConnectwiseService.class);

    public static class ConnectwiseCredentials {
        private String connectwiseCompanyId;
        private String connectwiseSite;
        private String clientId;
        private String publicKey;
        private String privateKey;

        public String getConnectwiseCompanyId() {
            return connectwiseCompanyId;
        }

        public void setConnectwiseCompanyId(String connectwiseCompanyId) {
            this.connectwiseCompanyId = connectwiseCompanyId;
        }

        public String getConnectwiseSite() {
            return connectwiseSite;
        }

        public void setConnectwiseSite(String connectwiseSite) {
            this.connectwiseSite = connectwiseSite;
        }

        public String getClientId() {
            return clientId;
        }

        public void setClientId(String clientId) {
            this.clientId = clientId;
        }

        public String getPublicKey() {
            return publicKey;
        }

        public void setPublicKey(String publicKey) {
            this.publicKey = publicKey;
        }

        public String getPrivateKey() {
            return privateKey;
        }

        public void setPrivateKey(String privateKey) {
            this.privateKey = privateKey;
        }
    }

    private final AWSService awsService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public ConnectwiseService(AWSService awsService) {
        this.awsService = awsService;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newHttpClient();
    }

    public String onNewEvent(String recordId, Map<String, Object> payload) throws IOException, InterruptedException {
        String action = stringValue(payload.get("Action"));
        log.info("Received ConnectWise action={} event for recordId={}", action, recordId);

        if (!StringUtils.hasText(action)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No Action found in payload.");
        }

        if (!isSupportedAction(action)) {
            log.info("Ignoring ConnectWise action={}", action);
            return "Ignored event action: " + action;
        }

        if (!payload.containsKey("CompanyId")) {
            log.warn("No CompanyId found in payload for recordId={}", recordId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No CompanyId found in payload.");
        }

        String connectwiseCompanyId = stringValue(payload.get("CompanyId"));
        Optional<String> tenantId = awsService.resolveTenantIdByConnectwiseCompanyId(connectwiseCompanyId);
        if (tenantId.isEmpty()) {
            log.info("Ignoring event for unknown ConnectWise company={}", connectwiseCompanyId);
            return "Ignored event for unknown ConnectWise company: " + connectwiseCompanyId;
        }

        String ticketId = resolveTicketId(recordId, payload);
        if (!StringUtils.hasText(ticketId)) {
            log.warn("No ticket ID found in payload for recordId={}", recordId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No ticket ID found in payload.");
        }

        Map<String, Object> entity = resolveEntity(payload.get("Entity"));
        if (entity == null) {
            log.warn("No Entity found in payload for recordId={}", recordId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No Entity found in payload.");
        }

        Optional<ConnectwiseCredentials> credentials = awsService.loadConnectwiseCredentials(tenantId.get());
        if (credentials.isEmpty()) {
            awsService.saveActivityEvent(buildFailedEvent(
                tenantId.get(),
                ticketId,
                "ConnectWise credentials are incomplete for this tenant."
            ));
            return "Missing ConnectWise credentials for tenant: " + tenantId.get();
        }

        ConnectwiseTicketResponse ticket;
        try {
            ticket = fetchTicketById(tenantId.get(), ticketId, credentials.get());
        } catch (IOException exception) {
            awsService.saveActivityEvent(buildFailedEvent(
                tenantId.get(),
                ticketId,
                "ConnectWise ticket fetch failed and needs review."
            ));
            throw exception;
        }

        awsService.saveTicketSnapshot(buildTicketSnapshot(tenantId.get(), ticket));
        awsService.saveActivityEvent(buildReviewEvent(tenantId.get(), ticket, action));

        log.info("Finished processing event for ticketId={} summary={}", ticketId, ticket.getSummary());
        return "Processed ConnectWise " + action + " event for ticketId: " + ticketId;
    }

    public ConnectwiseTicketResponse fetchTicketById(String tenantId, String ticketId, ConnectwiseCredentials credentials) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(buildBaseUrl(credentials.getConnectwiseSite()) + "/service/tickets/" + ticketId))
            .header("Authorization", buildAuthHeader(credentials))
            .header("clientId", credentials.getClientId())
            .header("Content-Type", "application/json")
            .GET()
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        int statusCode = response.statusCode();
        if (statusCode < 200 || statusCode >= 300) {
            throw new IOException("ConnectWise ticket fetch failed with HTTP " + statusCode);
        }

        return objectMapper.readValue(response.body(), ConnectwiseTicketResponse.class);
    }

    private boolean isSupportedAction(String action) {
        return "added".equalsIgnoreCase(action) || "updated".equalsIgnoreCase(action);
    }

    private String resolveTicketId(String recordId, Map<String, Object> payload) {
        if (StringUtils.hasText(stringValue(payload.get("ID")))) {
            return stringValue(payload.get("ID"));
        }
        if (StringUtils.hasText(recordId)) {
            return recordId.trim();
        }
        if (StringUtils.hasText(stringValue(payload.get("recordId")))) {
            return stringValue(payload.get("recordId"));
        }
        return null;
    }

    private Map<String, Object> resolveEntity(Object rawEntity) throws IOException {
        if (rawEntity == null) {
            return null;
        }
        if (rawEntity instanceof Map<?, ?> entityMap) {
            @SuppressWarnings("unchecked")
            Map<String, Object> typedMap = (Map<String, Object>) entityMap;
            return typedMap;
        }

        String entityJson = stringValue(rawEntity);
        if (!StringUtils.hasText(entityJson) || "null".equalsIgnoreCase(entityJson)) {
            return null;
        }

        return objectMapper.readValue(entityJson, new TypeReference<Map<String, Object>>() { });
    }

    private String buildBaseUrl(String site) {
        String normalizedSite = stringValue(site);
        if (!StringUtils.hasText(normalizedSite)) {
            throw new IllegalStateException("ConnectWise site is not configured.");
        }

        if (normalizedSite.startsWith("http://") || normalizedSite.startsWith("https://")) {
            return normalizedSite.replaceAll("/+$", "") + "/v4_6_release/apis/3.0";
        }

        return "https://" + normalizedSite + "/v4_6_release/apis/3.0";
    }

    private String buildAuthHeader(ConnectwiseCredentials credentials) {
        String rawAuth = credentials.getConnectwiseCompanyId()
            + "+"
            + credentials.getPublicKey()
            + ":"
            + credentials.getPrivateKey();

        return "Basic " + Base64.getEncoder().encodeToString(rawAuth.getBytes(StandardCharsets.UTF_8));
    }

    private TicketSnapshot buildTicketSnapshot(String tenantId, ConnectwiseTicketResponse ticket) {
        TicketSnapshot snapshot = new TicketSnapshot();
        snapshot.setTenantId(tenantId);
        snapshot.setTicketId(String.valueOf(ticket.getId()));
        snapshot.setSourceSystem("connectwise");
        snapshot.setSummary(valueOrFallback(ticket.getSummary(), "ConnectWise ticket"));
        snapshot.setCompany(ticket.getCompany() != null ? ticket.getCompany().getIdentifier() : "Unknown company");
        snapshot.setBoard(ticket.getBoard() != null ? ticket.getBoard().getName() : "Unassigned");
        snapshot.setTicketStatus(ticket.getStatus() != null ? ticket.getStatus().getName() : "Unknown");
        snapshot.setContact(ticket.getContact() != null ? ticket.getContact().getName() : "Unknown contact");
        snapshot.setAssignee(ticket.getOwner() != null ? ticket.getOwner().getIdentifier() : "Unassigned");
        snapshot.setLastEventStatus("needs_review");
        snapshot.setLastEventAt(Instant.now().toString());
        snapshot.setLastDestinationLabel("Pending rule evaluation");
        snapshot.setLastRoutingRuleId(null);
        return snapshot;
    }

    private ActivityEvent buildReviewEvent(String tenantId, ConnectwiseTicketResponse ticket, String action) {
        ActivityEvent event = new ActivityEvent();
        event.setTenantId(tenantId);
        event.setSourceSystem("connectwise");
        event.setSourceTicketId(String.valueOf(ticket.getId()));
        event.setStatus("needs_review");
        event.setTitle(valueOrFallback(ticket.getSummary(), "ConnectWise ticket"));
        event.setDescription("Received ConnectWise " + action.toLowerCase() + " event and stored ticket activity.");
        event.setTicketSummary(valueOrFallback(ticket.getSummary(), "ConnectWise ticket"));
        event.setBoard(ticket.getBoard() != null ? ticket.getBoard().getName() : "Unassigned");
        event.setTicketStatus(ticket.getStatus() != null ? ticket.getStatus().getName() : "Unknown");
        event.setCompany(ticket.getCompany() != null ? ticket.getCompany().getIdentifier() : "Unknown company");
        event.setContact(ticket.getContact() != null ? ticket.getContact().getName() : "Unknown contact");
        event.setAssignee(ticket.getOwner() != null ? ticket.getOwner().getIdentifier() : "Unassigned");
        event.setDestinationLabel("Pending rule evaluation");
        event.setCreatedAt(Instant.now().toString());
        return event;
    }

    private ActivityEvent buildFailedEvent(String tenantId, String ticketId, String description) {
        ActivityEvent event = new ActivityEvent();
        event.setTenantId(tenantId);
        event.setSourceSystem("connectwise");
        event.setSourceTicketId(ticketId);
        event.setStatus("failed");
        event.setTitle("ConnectWise ticket " + ticketId);
        event.setDescription(description);
        event.setTicketSummary("ConnectWise ticket " + ticketId);
        event.setBoard("Unknown");
        event.setTicketStatus("Unknown");
        event.setCompany("Unknown company");
        event.setContact("Unknown contact");
        event.setAssignee("Unassigned");
        event.setDestinationLabel("Pending rule evaluation");
        event.setCreatedAt(Instant.now().toString());
        return event;
    }

    private String valueOrFallback(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value).trim();
    }
}
