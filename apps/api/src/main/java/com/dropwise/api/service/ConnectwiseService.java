package com.dropwise.api.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.dropwise.api.model.ActivityEvent;
import com.dropwise.api.model.ConnectwiseWebhookRegistrationResponse;
import com.dropwise.api.model.ConnectwiseTicketResponse;
import com.dropwise.api.model.TicketSnapshot;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ConnectwiseService {

    private static final Logger log = LoggerFactory.getLogger(ConnectwiseService.class);
    private static final String CALLBACK_DESCRIPTION = "Dropwise ticket callback";
    private static final int CALLBACK_OBJECT_ID = 1;
    private static final String CALLBACK_TYPE = "Ticket";
    private static final String CALLBACK_LEVEL = "Board";

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

    private static class CallbackEntry {
        private String id;
        private String url;
        private String description;
        private Integer objectId;
        private String type;
        private String level;
        private Boolean inactiveFlag;
    }

    private final AWSService awsService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String publicApiBaseUrl;

    public ConnectwiseService(
        AWSService awsService,
        @org.springframework.beans.factory.annotation.Value("${app.public-api-base-url:http://localhost:8080}") String publicApiBaseUrl
    ) {
        this.awsService = awsService;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newHttpClient();
        this.publicApiBaseUrl = publicApiBaseUrl;
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

    public ConnectwiseWebhookRegistrationResponse registerWebhook(String tenantId) throws IOException, InterruptedException {
        if (!StringUtils.hasText(tenantId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing tenantId.");
        }

        Optional<ConnectwiseCredentials> credentials = awsService.loadConnectwiseCredentials(tenantId);
        if (credentials.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ConnectWise credentials are incomplete for this tenant.");
        }

        String callbackUrl = buildCallbackUrl();
        String webhookId = createOrReconcileCallback(credentials.get(), callbackUrl);
        awsService.saveConnectwiseWebhook(tenantId, webhookId, callbackUrl, CALLBACK_DESCRIPTION);
        return new ConnectwiseWebhookRegistrationResponse(true, webhookId, "ConnectWise webhook registered.");
    }

    private String createOrReconcileCallback(ConnectwiseCredentials credentials, String callbackUrl)
        throws IOException, InterruptedException {
        String payload = objectMapper.writeValueAsString(Map.of(
            "description", CALLBACK_DESCRIPTION,
            "url", callbackUrl,
            "objectId", CALLBACK_OBJECT_ID,
            "type", CALLBACK_TYPE,
            "level", CALLBACK_LEVEL,
            "inactiveFlag", false
        ));

        HttpResponse<String> response = sendRequest(
            credentials,
            "/system/callbacks/",
            "POST",
            payload
        );

        int statusCode = response.statusCode();
        if (statusCode >= 200 && statusCode < 300) {
            JsonNode body = objectMapper.readTree(response.body());
            return extractWebhookId(body);
        }

        String responseBody = response.body();
        if (statusCode == 400 && responseBody != null && responseBody.contains("ObjectExists")) {
            CallbackEntry existing = findMatchingCallback(credentials);
            if (existing == null) {
                throw new IOException("ConnectWise callback already exists, but the existing callback could not be found.");
            }

            if (callbackUrl.equals(trim(existing.url)) && !Boolean.TRUE.equals(existing.inactiveFlag)) {
                return existing.id;
            }

            deleteCallback(credentials, existing.id);
            HttpResponse<String> recreated = sendRequest(
                credentials,
                "/system/callbacks/",
                "POST",
                payload
            );

            if (recreated.statusCode() < 200 || recreated.statusCode() >= 300) {
                throw new IOException("ConnectWise webhook re-registration failed with HTTP "
                    + recreated.statusCode() + ". Body: " + safeBodySnippet(recreated.body()));
            }

            JsonNode recreatedBody = objectMapper.readTree(recreated.body());
            return extractWebhookId(recreatedBody);
        }

        throw new IOException("ConnectWise webhook registration failed with HTTP "
            + statusCode + ". Body: " + safeBodySnippet(responseBody));
    }

    public ConnectwiseTicketResponse fetchTicketById(String tenantId, String ticketId, ConnectwiseCredentials credentials) throws IOException, InterruptedException {
        HttpResponse<String> response = sendRequest(
            credentials,
            "/service/tickets/" + ticketId,
            "GET",
            null
        );
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

    private String buildCallbackUrl() {
        String normalized = trim(publicApiBaseUrl);
        if (!StringUtils.hasText(normalized) || normalized.contains("localhost")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "APP_PUBLIC_API_BASE_URL must be configured before registering ConnectWise webhooks."
            );
        }

        return normalized.replaceAll("/+$", "") + "/api/connectwise/events?recordId=";
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

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String extractWebhookId(JsonNode body) {
        if (body == null || body.isNull()) {
            return null;
        }
        if (body.has("id") && !body.get("id").isNull()) {
            return body.get("id").asText();
        }
        if (body.has("callbackId") && !body.get("callbackId").isNull()) {
            return body.get("callbackId").asText();
        }
        return null;
    }

    private CallbackEntry findMatchingCallback(ConnectwiseCredentials credentials) throws IOException, InterruptedException {
        HttpResponse<String> response = sendRequest(credentials, "/system/callbacks", "GET", null);
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("ConnectWise callback lookup failed with HTTP "
                + response.statusCode() + ". Body: " + safeBodySnippet(response.body()));
        }

        JsonNode body = objectMapper.readTree(response.body());
        if (!body.isArray()) {
            return null;
        }

        for (JsonNode node : body) {
            String type = node.path("type").asText(null);
            String level = node.path("level").asText(null);
            int objectId = node.path("objectId").asInt(Integer.MIN_VALUE);
            if (CALLBACK_TYPE.equalsIgnoreCase(type)
                && CALLBACK_LEVEL.equalsIgnoreCase(level)
                && objectId == CALLBACK_OBJECT_ID) {
                CallbackEntry entry = new CallbackEntry();
                entry.id = node.path("id").isMissingNode() ? null : node.path("id").asText(null);
                entry.url = node.path("url").asText(null);
                entry.description = node.path("description").asText(null);
                entry.objectId = objectId;
                entry.type = type;
                entry.level = level;
                entry.inactiveFlag = node.has("inactiveFlag") ? node.path("inactiveFlag").asBoolean() : null;
                return entry;
            }
        }

        return null;
    }

    private void deleteCallback(ConnectwiseCredentials credentials, String callbackId) throws IOException, InterruptedException {
        if (!StringUtils.hasText(callbackId)) {
            throw new IOException("Cannot delete existing ConnectWise callback without an id.");
        }

        HttpResponse<String> response = sendRequest(credentials, "/system/callbacks/" + callbackId, "DELETE", null);
        int statusCode = response.statusCode();
        if (statusCode != 204 && (statusCode < 200 || statusCode >= 300)) {
            throw new IOException("ConnectWise callback delete failed with HTTP "
                + statusCode + ". Body: " + safeBodySnippet(response.body()));
        }
    }

    private HttpResponse<String> sendRequest(
        ConnectwiseCredentials credentials,
        String path,
        String method,
        String body
    ) throws IOException, InterruptedException {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create(buildBaseUrl(credentials.getConnectwiseSite()) + path))
            .header("Authorization", buildAuthHeader(credentials))
            .header("clientId", credentials.getClientId())
            .header("Content-Type", "application/json");

        switch (method) {
            case "GET" -> builder.GET();
            case "POST" -> builder.POST(HttpRequest.BodyPublishers.ofString(body != null ? body : ""));
            case "DELETE" -> builder.DELETE();
            default -> throw new IllegalArgumentException("Unsupported ConnectWise HTTP method: " + method);
        }

        return httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private static String safeBodySnippet(String body) {
        if (body == null) {
            return "<empty>";
        }
        String compact = body.replaceAll("\\s+", " ").trim();
        return compact.length() <= 300 ? compact : compact.substring(0, 300) + "...";
    }
}
