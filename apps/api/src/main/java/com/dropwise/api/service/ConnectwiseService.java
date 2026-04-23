package com.dropwise.api.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.dropwise.api.model.ActivityEvent;
import com.dropwise.api.model.ConnectwiseTicketTimelineItem;
import com.dropwise.api.model.ConnectwiseWebhookRegistrationResponse;
import com.dropwise.api.model.ConnectwiseTicketResponse;
import com.dropwise.api.model.MessageCorrelation;
import com.dropwise.api.model.RoutingRule;
import com.dropwise.api.model.SlackSecretRequest;
import com.dropwise.api.model.TicketLinkage;
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
    private static final long SLACK_TOKEN_REFRESH_BUFFER_MS = 300_000L;
    private static final DateTimeFormatter CONNECTWISE_TIME_ENTRY_FORMATTER = DateTimeFormatter
        .ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'")
        .withZone(ZoneId.of("UTC"));

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

    private static class SlackMessageResult {
        private String channelId;
        private String messageTs;
    }

    private static class RuleExecutionResult {
        private String status;
        private String description;
        private String destinationLabel;
        private String routingRuleId;
    }

    private final AWSService awsService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String publicApiBaseUrl;
    private final String slackClientId;
    private final String slackClientSecret;
    private final ConcurrentMap<String, Object> slackLinkageLocks = new ConcurrentHashMap<>();

    public ConnectwiseService(
        AWSService awsService,
        @org.springframework.beans.factory.annotation.Value("${app.public-api-base-url:http://localhost:8080}") String publicApiBaseUrl,
        @org.springframework.beans.factory.annotation.Value("${slack.client.id:}") String slackClientId,
        @org.springframework.beans.factory.annotation.Value("${slack.client.secret:}") String slackClientSecret
    ) {
        this.awsService = awsService;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newHttpClient();
        this.publicApiBaseUrl = publicApiBaseUrl;
        this.slackClientId = slackClientId;
        this.slackClientSecret = slackClientSecret;
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

        String eventTimestamp = Instant.now().toString();
        RuleExecutionResult executionResult = executeRoutingRules(tenantId.get(), ticket, eventTimestamp);

        awsService.saveTicketSnapshot(buildTicketSnapshot(tenantId.get(), ticket, executionResult, eventTimestamp));
        awsService.saveActivityEvent(buildActivityEvent(tenantId.get(), ticket, action, executionResult, eventTimestamp));

        log.info("Finished processing event for ticketId={} summary={}", ticketId, ticket.getSummary());
        return "Processed ConnectWise " + action + " event for ticketId: " + ticketId;
    }

    public ConnectwiseWebhookRegistrationResponse registerWebhook(String tenantId) throws IOException, InterruptedException {
        if (!StringUtils.hasText(tenantId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing tenantId.");
        }

        Optional<String> existingWebhookId = awsService.loadConnectwiseWebhookId(tenantId);
        if (existingWebhookId.isPresent()) {
            return new ConnectwiseWebhookRegistrationResponse(
                true,
                existingWebhookId.get(),
                "ConnectWise webhook already configured."
            );
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

    public String addSlackReplyAsTimeEntry(
        String tenantId,
        String ticketId,
        String replyText
    ) throws IOException, InterruptedException {
        Optional<ConnectwiseCredentials> credentials = awsService.loadConnectwiseCredentials(tenantId);
        if (credentials.isEmpty()) {
            throw new IOException("ConnectWise credentials are incomplete for this tenant.");
        }

        ConnectwiseTicketResponse ticket = fetchTicketById(tenantId, ticketId, credentials.get());
        Map<String, Object> payload = new java.util.LinkedHashMap<>();
        if (ticket.getCompany() != null) {
            payload.put("company", ticket.getCompany());
        }
        payload.put("companyType", "Client");
        payload.put("chargeToId", ticketId);
        payload.put("chargeToType", "ServiceTicket");
        payload.put("billableOption", "Billable");
        payload.put("actualHours", 0.15);
        payload.put("timeStart", CONNECTWISE_TIME_ENTRY_FORMATTER.format(Instant.now()));
        payload.put("notes", normalizeMessageLineEndings(replyText));
        payload.put("addToDetailDescriptionFlag", true);
        payload.put("addToInternalAnalysisFlag", false);
        payload.put("addToResolutionFlag", false);
        payload.put("emailResourceFlag", true);
        payload.put("emailContactFlag", true);
        payload.put("emailCcFlag", false);
        payload.put("invoiceReady", 1);

        HttpResponse<String> response = sendRequest(
            credentials.get(),
            "/time/entries",
            "POST",
            objectMapper.writeValueAsString(payload)
        );
        int statusCode = response.statusCode();
        if (statusCode < 200 || statusCode >= 300) {
            throw new IOException("ConnectWise time entry creation failed with HTTP "
                + statusCode + ". Body: " + safeBodySnippet(response.body()));
        }

        JsonNode body = objectMapper.readTree(response.body());
        String timeEntryId = body.path("id").asText("");
        return StringUtils.hasText(timeEntryId) ? "time_entry:" + timeEntryId : null;
    }

    private List<ConnectwiseTicketTimelineItem> fetchTicketDiscussion(
        ConnectwiseCredentials credentials,
        String ticketId
    ) throws IOException, InterruptedException {
        List<ConnectwiseTicketTimelineItem> items = new ArrayList<>();
        items.addAll(fetchTicketNotes(credentials, ticketId));
        items.addAll(fetchTicketTimeEntries(credentials, ticketId));
        items.sort(Comparator.comparing(
            ConnectwiseTicketTimelineItem::getCreatedAt,
            Comparator.nullsLast(String::compareTo)
        ));
        return items;
    }

    private List<ConnectwiseTicketTimelineItem> fetchTicketNotes(
        ConnectwiseCredentials credentials,
        String ticketId
    ) throws IOException, InterruptedException {
        HttpResponse<String> response = sendRequest(
            credentials,
            "/service/tickets/" + ticketId + "/notes",
            "GET",
            null
        );
        int statusCode = response.statusCode();
        if (statusCode < 200 || statusCode >= 300) {
            throw new IOException("ConnectWise ticket notes fetch failed with HTTP " + statusCode);
        }

        JsonNode root = objectMapper.readTree(response.body());
        List<ConnectwiseTicketTimelineItem> items = new ArrayList<>();
        if (!root.isArray()) {
            return items;
        }

        for (JsonNode note : root) {
            String text = note.path("text").asText("");
            if (!StringUtils.hasText(text)) {
                continue;
            }

            ConnectwiseTicketTimelineItem item = new ConnectwiseTicketTimelineItem();
            item.setId(note.path("id").asText(""));
            item.setType("note");
            item.setAuthor(firstNonBlank(
                nestedText(note, "member", "name"),
                nestedText(note, "contact", "name")
            ));
            item.setContent(text);
            item.setCreatedAt(firstNonBlank(note.path("dateCreated").asText(""), note.path("timeStart").asText("")));
            item.setDetailDescriptionFlag(note.path("detailDescriptionFlag").asBoolean(false));
            item.setInternalAnalysisFlag(note.path("internalAnalysisFlag").asBoolean(false));
            item.setResolutionFlag(note.path("resolutionFlag").asBoolean(false));
            items.add(item);
        }
        return items;
    }

    private List<ConnectwiseTicketTimelineItem> fetchTicketTimeEntries(
        ConnectwiseCredentials credentials,
        String ticketId
    ) throws IOException, InterruptedException {
        String conditions = URLEncoder.encode("chargeToId=" + ticketId, StandardCharsets.UTF_8);
        String fields = URLEncoder.encode(
            "id,member,timeStart,timeEnd,actualHours,notes,addToDetailDescriptionFlag,addToInternalAnalysisFlag,addToResolutionFlag,dateEntered,_info",
            StandardCharsets.UTF_8
        );

        HttpResponse<String> response = sendRequest(
            credentials,
            "/time/entries?conditions=" + conditions + "&fields=" + fields,
            "GET",
            null
        );
        int statusCode = response.statusCode();
        if (statusCode < 200 || statusCode >= 300) {
            throw new IOException("ConnectWise time entry fetch failed with HTTP " + statusCode);
        }

        JsonNode root = objectMapper.readTree(response.body());
        List<ConnectwiseTicketTimelineItem> items = new ArrayList<>();
        if (!root.isArray()) {
            return items;
        }

        for (JsonNode entry : root) {
            String notes = entry.path("notes").asText("");
            if (!StringUtils.hasText(notes)) {
                continue;
            }

            ConnectwiseTicketTimelineItem item = new ConnectwiseTicketTimelineItem();
            item.setId(entry.path("id").asText(""));
            item.setType("time_entry");
            item.setAuthor(nestedText(entry, "member", "name"));
            item.setContent(notes);
            item.setCreatedAt(firstNonBlank(entry.path("dateEntered").asText(""), entry.path("timeStart").asText("")));
            item.setDetailDescriptionFlag(entry.path("addToDetailDescriptionFlag").asBoolean(false));
            item.setInternalAnalysisFlag(entry.path("addToInternalAnalysisFlag").asBoolean(false));
            item.setResolutionFlag(entry.path("addToResolutionFlag").asBoolean(false));
            item.setActualHours(entry.path("actualHours").asText(""));
            items.add(item);
        }
        return items;
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

    private TicketSnapshot buildTicketSnapshot(
        String tenantId,
        ConnectwiseTicketResponse ticket,
        RuleExecutionResult executionResult,
        String eventTimestamp
    ) {
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
        snapshot.setLastEventStatus(executionResult.status);
        snapshot.setLastEventAt(eventTimestamp);
        snapshot.setLastDestinationLabel(executionResult.destinationLabel);
        snapshot.setLastRoutingRuleId(executionResult.routingRuleId);
        return snapshot;
    }

    private ActivityEvent buildActivityEvent(
        String tenantId,
        ConnectwiseTicketResponse ticket,
        String action,
        RuleExecutionResult executionResult,
        String eventTimestamp
    ) {
        ActivityEvent event = new ActivityEvent();
        event.setTenantId(tenantId);
        event.setSourceSystem("connectwise");
        event.setSourceTicketId(String.valueOf(ticket.getId()));
        event.setStatus(executionResult.status);
        event.setTitle(valueOrFallback(ticket.getSummary(), "ConnectWise ticket"));
        event.setDescription(buildEventDescription(action, executionResult.description));
        event.setTicketSummary(valueOrFallback(ticket.getSummary(), "ConnectWise ticket"));
        event.setBoard(ticket.getBoard() != null ? ticket.getBoard().getName() : "Unassigned");
        event.setTicketStatus(ticket.getStatus() != null ? ticket.getStatus().getName() : "Unknown");
        event.setCompany(ticket.getCompany() != null ? ticket.getCompany().getIdentifier() : "Unknown company");
        event.setContact(ticket.getContact() != null ? ticket.getContact().getName() : "Unknown contact");
        event.setAssignee(ticket.getOwner() != null ? ticket.getOwner().getIdentifier() : "Unassigned");
        event.setDestinationLabel(executionResult.destinationLabel);
        event.setRoutingRuleId(executionResult.routingRuleId);
        event.setCreatedAt(eventTimestamp);
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
        event.setDestinationLabel(null);
        event.setCreatedAt(Instant.now().toString());
        return event;
    }

    private RuleExecutionResult executeRoutingRules(
        String tenantId,
        ConnectwiseTicketResponse ticket,
        String eventTimestamp
    ) {
        List<RoutingRule> activeRules = new ArrayList<>();
        for (RoutingRule rule : awsService.listRules(tenantId)) {
            if (!rule.isEnabled()) {
                continue;
            }
            if (StringUtils.hasText(rule.getSourceSystem())
                && !"connectwise".equalsIgnoreCase(rule.getSourceSystem())) {
                continue;
            }
            activeRules.add(rule);
        }

        for (RoutingRule rule : activeRules) {
            if (!matchesRule(rule, ticket)) {
                continue;
            }
            return routeMatchedRule(tenantId, ticket, rule, eventTimestamp);
        }

        RuleExecutionResult result = new RuleExecutionResult();
        result.status = "unmatched";
        result.description = "No active routing rule matched this ticket.";
        result.destinationLabel = null;
        result.routingRuleId = null;
        return result;
    }

    private RuleExecutionResult routeMatchedRule(
        String tenantId,
        ConnectwiseTicketResponse ticket,
        RoutingRule rule,
        String eventTimestamp
    ) {
        String channelId = rule.getAction() != null ? trim(rule.getAction().getTargetChannelId()) : null;
        if (!StringUtils.hasText(channelId)) {
            RuleExecutionResult result = new RuleExecutionResult();
            result.status = "failed";
            result.description = "Matched rule \"" + valueOrFallback(rule.getName(), "Unnamed rule")
                + "\" but no Slack destination was configured.";
            result.destinationLabel = null;
            result.routingRuleId = rule.getRuleId();
            return result;
        }

        try {
            SlackMessageResult messageResult = syncTicketRootMessageToSlack(
                tenantId,
                ticket,
                rule,
                channelId,
                eventTimestamp
            );
            RuleExecutionResult result = new RuleExecutionResult();
            result.status = "success";
            result.description = "Matched rule \"" + valueOrFallback(rule.getName(), "Unnamed rule")
                + "\" and routed to Slack.";
            result.destinationLabel = valueOrFallback(messageResult.channelId, channelId);
            result.routingRuleId = rule.getRuleId();
            return result;
        } catch (ResponseStatusException exception) {
            log.warn("Slack delivery failed for tenant={} ticketId={} ruleId={}: {}",
                tenantId,
                ticket.getId(),
                rule.getRuleId(),
                exception.getReason());

            RuleExecutionResult result = new RuleExecutionResult();
            result.status = "failed";
            result.description = "Matched rule \"" + valueOrFallback(rule.getName(), "Unnamed rule")
                + "\" but Slack delivery failed: " + valueOrFallback(exception.getReason(), "unknown error");
            result.destinationLabel = channelId;
            result.routingRuleId = rule.getRuleId();
            return result;
        }
    }

    private SlackMessageResult syncTicketRootMessageToSlack(
        String tenantId,
        ConnectwiseTicketResponse ticket,
        RoutingRule rule,
        String channelId,
        String eventTimestamp
    ) {
        String ticketId = ticket.getId() != null ? String.valueOf(ticket.getId()) : null;
        if (!StringUtils.hasText(ticketId)) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Cannot route a ticket without a ticket id.");
        }

        String lockKey = tenantId + "#connectwise#" + ticketId + "#slack#" + channelId;
        Object lock = slackLinkageLocks.computeIfAbsent(lockKey, key -> new Object());
        try {
            synchronized (lock) {
                return syncTicketRootMessageToSlackLocked(tenantId, ticket, ticketId, rule, channelId, eventTimestamp);
            }
        } finally {
            slackLinkageLocks.remove(lockKey, lock);
        }
    }

    private SlackMessageResult syncTicketRootMessageToSlackLocked(
        String tenantId,
        ConnectwiseTicketResponse ticket,
        String ticketId,
        RoutingRule rule,
        String channelId,
        String eventTimestamp
    ) {
        SlackSecretRequest secret = awsService.loadSlackSecret(tenantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Slack bot token not found."));
        String botToken = getValidSlackBotToken(tenantId, secret);
        String messageText = buildSlackMessageText(ticket, eventTimestamp);

        Optional<TicketLinkage> existingLinkage = awsService.loadTicketLinkage(
            tenantId,
            "connectwise",
            ticketId,
            "slack",
            channelId
        );
        if (existingLinkage.isEmpty()) {
            existingLinkage = findReusableSlackLinkage(tenantId, ticketId, rule, channelId);
        }

        if (existingLinkage.isPresent()
            && StringUtils.hasText(existingLinkage.get().getDestinationRootMessageId())) {
            String messageChannelId = StringUtils.hasText(existingLinkage.get().getDestinationConversationId())
                ? existingLinkage.get().getDestinationConversationId()
                : channelId;
            SlackMessageResult updateResult = updateSlackRootMessage(
                tenantId,
                secret,
                botToken,
                messageChannelId,
                existingLinkage.get().getDestinationRootMessageId(),
                messageText
            );
            TicketLinkage linkage = existingLinkage.get();
            linkage.setDestinationWorkspaceId(valueOrFallback(secret.getWorkspaceId(), linkage.getDestinationWorkspaceId()));
            linkage.setRoutingRuleId(rule.getRuleId());
            linkage.setStatus("active");
            linkage = awsService.saveTicketLinkage(linkage);
            syncTicketDiscussionToSlackThread(tenantId, ticketId, secret, botToken, linkage);
            return updateResult;
        }

        SlackMessageResult postResult = postTicketToSlack(
            tenantId,
            secret,
            botToken,
            ticket,
            channelId,
            eventTimestamp
        );
        if (!StringUtils.hasText(postResult.messageTs)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack message post did not return a message timestamp."
            );
        }

        TicketLinkage linkage = new TicketLinkage();
        linkage.setTenantId(tenantId);
        linkage.setSourceSystem("connectwise");
        linkage.setSourceTicketId(ticketId);
        linkage.setDestinationSystem("slack");
        linkage.setDestinationWorkspaceId(secret.getWorkspaceId());
        linkage.setDestinationConversationId(channelId);
        linkage.setDestinationThreadId(postResult.messageTs);
        linkage.setDestinationRootMessageId(postResult.messageTs);
        linkage.setRoutingRuleId(rule.getRuleId());
        linkage.setStatus("active");
        linkage = awsService.saveTicketLinkage(linkage);
        syncTicketDiscussionToSlackThread(tenantId, ticketId, secret, botToken, linkage);
        return postResult;
    }

    private void syncTicketDiscussionToSlackThread(
        String tenantId,
        String ticketId,
        SlackSecretRequest secret,
        String botToken,
        TicketLinkage linkage
    ) {
        try {
            Optional<ConnectwiseCredentials> credentials = awsService.loadConnectwiseCredentials(tenantId);
            if (credentials.isEmpty()) {
                log.warn("Skipping discussion sync for tenant={} ticketId={} because ConnectWise credentials are incomplete.",
                    tenantId,
                    ticketId);
                return;
            }

            List<ConnectwiseTicketTimelineItem> discussion = fetchTicketDiscussion(credentials.get(), ticketId);
            TicketLinkage currentLinkage = linkage;
            for (ConnectwiseTicketTimelineItem item : discussion) {
                String providerItemId = buildProviderItemId(item);
                if (!StringUtils.hasText(providerItemId) || alreadyPosted(currentLinkage, providerItemId)) {
                    continue;
                }

                SlackMessageResult replyResult = postSlackThreadReply(
                    tenantId,
                    secret,
                    botToken,
                    currentLinkage.getDestinationConversationId(),
                    valueOrFallback(currentLinkage.getDestinationThreadId(), currentLinkage.getDestinationRootMessageId()),
                    buildSlackThreadReplyText(item)
                );
                if (!StringUtils.hasText(replyResult.messageTs)) {
                    log.warn("Slack thread reply for tenant={} ticketId={} providerItemId={} did not return a timestamp.",
                        tenantId,
                        ticketId,
                        providerItemId);
                    continue;
                }

                MessageCorrelation correlation = new MessageCorrelation();
                correlation.setProviderItemId(providerItemId);
                correlation.setDestinationMessageId(replyResult.messageTs);
                currentLinkage.getMessageCorrelations().add(correlation);
                currentLinkage = awsService.saveTicketLinkage(currentLinkage);
            }
        } catch (IOException exception) {
            log.warn("ConnectWise discussion sync failed for tenant={} ticketId={}: {}",
                tenantId,
                ticketId,
                exception.getMessage());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("ConnectWise discussion sync interrupted for tenant={} ticketId={}", tenantId, ticketId);
        } catch (ResponseStatusException exception) {
            log.warn("Slack discussion sync failed for tenant={} ticketId={}: {}",
                tenantId,
                ticketId,
                exception.getReason());
        }
    }

    private Optional<TicketLinkage> findReusableSlackLinkage(
        String tenantId,
        String ticketId,
        RoutingRule rule,
        String channelId
    ) {
        List<TicketLinkage> linkages = awsService.listTicketLinkages(tenantId, "connectwise", ticketId, "slack");
        if (linkages.isEmpty()) {
            return Optional.empty();
        }

        for (TicketLinkage linkage : linkages) {
            if (channelId.equals(linkage.getDestinationConversationId())) {
                return Optional.of(linkage);
            }
        }

        for (TicketLinkage linkage : linkages) {
            if (StringUtils.hasText(rule.getRuleId()) && rule.getRuleId().equals(linkage.getRoutingRuleId())) {
                return Optional.of(linkage);
            }
        }

        return linkages.size() == 1 ? Optional.of(linkages.get(0)) : Optional.empty();
    }

    private boolean matchesRule(RoutingRule rule, ConnectwiseTicketResponse ticket) {
        if (rule.getMatch() == null || rule.getMatch().getConditions() == null || rule.getMatch().getConditions().isEmpty()) {
            return false;
        }

        boolean useOr = "OR".equalsIgnoreCase(trim(rule.getMatch().getJoinOperator()));
        boolean matched = useOr ? false : true;

        for (RoutingRule.Condition condition : rule.getMatch().getConditions()) {
            boolean conditionMatches = matchesCondition(condition, ticket);
            if (useOr && conditionMatches) {
                return true;
            }
            if (!useOr && !conditionMatches) {
                return false;
            }
            matched = conditionMatches;
        }

        return matched;
    }

    private boolean matchesCondition(RoutingRule.Condition condition, ConnectwiseTicketResponse ticket) {
        if (condition == null) {
            return false;
        }

        String actualValue = normalizeForMatch(ticketFieldValue(ticket, condition.getField()));
        String expectedValue = normalizeForMatch(condition.getValue());
        String operator = trim(condition.getOperator());

        if (!StringUtils.hasText(expectedValue) || !StringUtils.hasText(operator)) {
            return false;
        }

        return switch (operator.toLowerCase()) {
            case "equals" -> actualValue.equals(expectedValue);
            case "not equals" -> !actualValue.equals(expectedValue);
            case "contains" -> actualValue.contains(expectedValue);
            case "starts with" -> actualValue.startsWith(expectedValue);
            default -> false;
        };
    }

    private String ticketFieldValue(ConnectwiseTicketResponse ticket, String field) {
        String normalizedField = trim(field);
        if (!StringUtils.hasText(normalizedField)) {
            return "";
        }

        return switch (normalizedField) {
            case "ticketSummary" -> valueOrFallback(ticket.getSummary(), "");
            case "company" -> ticket.getCompany() != null ? valueOrFallback(ticket.getCompany().getIdentifier(), "") : "";
            case "board" -> ticket.getBoard() != null ? valueOrFallback(ticket.getBoard().getName(), "") : "";
            case "status" -> ticket.getStatus() != null ? valueOrFallback(ticket.getStatus().getName(), "") : "";
            case "contact" -> ticket.getContact() != null ? valueOrFallback(ticket.getContact().getName(), "") : "";
            case "assignee" -> ticket.getOwner() != null ? valueOrFallback(ticket.getOwner().getIdentifier(), "") : "";
            default -> "";
        };
    }

    private String normalizeForMatch(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private String buildEventDescription(String action, String outcomeDescription) {
        return "Received ConnectWise " + action.toLowerCase() + " event. " + outcomeDescription;
    }

    private SlackMessageResult postSlackThreadReply(
        String tenantId,
        SlackSecretRequest secret,
        String botToken,
        String channelId,
        String threadTs,
        String messageText
    ) {
        if (!StringUtils.hasText(channelId) || !StringUtils.hasText(threadTs)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Slack thread linkage is incomplete.");
        }

        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                "channel", channelId,
                "thread_ts", threadTs,
                "text", messageText
            ));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://slack.com/api/chat.postMessage"))
                .header("Authorization", "Bearer " + botToken)
                .header("Content-Type", "application/json; charset=utf-8")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack thread reply post failed with HTTP " + response.statusCode() + ". Body: " + response.body()
                );
            }

            Map<String, Object> body = objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
            Object okValue = body.get("ok");
            if (!(okValue instanceof Boolean ok) || !ok) {
                String errorCode = body.get("error") instanceof String error ? error : response.body();
                if ("token_expired".equals(errorCode)) {
                    String refreshedToken = refreshSlackBotToken(tenantId, secret);
                    return retryPostSlackThreadReply(channelId, threadTs, messageText, refreshedToken);
                }
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack thread reply post failed. Body: " + response.body()
                );
            }

            SlackMessageResult result = new SlackMessageResult();
            result.channelId = body.get("channel") instanceof String postedChannelId ? postedChannelId : channelId;
            result.messageTs = body.get("ts") instanceof String ts ? ts : null;
            return result;
        } catch (IOException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack thread reply post failed: " + exception.getMessage()
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack thread reply post interrupted."
            );
        }
    }

    private SlackMessageResult postTicketToSlack(
        String tenantId,
        SlackSecretRequest secret,
        String botToken,
        ConnectwiseTicketResponse ticket,
        String channelId,
        String eventTimestamp
    ) {
        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                "channel", channelId,
                "text", buildSlackMessageText(ticket, eventTimestamp)
            ));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://slack.com/api/chat.postMessage"))
                .header("Authorization", "Bearer " + botToken)
                .header("Content-Type", "application/json; charset=utf-8")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack message post failed with HTTP " + response.statusCode() + ". Body: " + response.body()
                );
            }

            Map<String, Object> body = objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
            Object okValue = body.get("ok");
            if (!(okValue instanceof Boolean ok) || !ok) {
                String errorCode = body.get("error") instanceof String error ? error : response.body();
                if ("token_expired".equals(errorCode)) {
                    String refreshedToken = refreshSlackBotToken(tenantId, secret);
                    return retryPostTicketToSlack(ticket, channelId, eventTimestamp, refreshedToken);
                }
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack message post failed. Body: " + response.body()
                );
            }

            SlackMessageResult result = new SlackMessageResult();
            result.channelId = body.get("channel") instanceof String postedChannelId ? postedChannelId : channelId;
            result.messageTs = body.get("ts") instanceof String ts ? ts : null;
            return result;
        } catch (IOException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack message post failed: " + exception.getMessage()
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack message post interrupted."
            );
        }
    }

    private SlackMessageResult updateSlackRootMessage(
        String tenantId,
        SlackSecretRequest secret,
        String botToken,
        String channelId,
        String messageTs,
        String messageText
    ) {
        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                "channel", channelId,
                "ts", messageTs,
                "text", messageText
            ));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://slack.com/api/chat.update"))
                .header("Authorization", "Bearer " + botToken)
                .header("Content-Type", "application/json; charset=utf-8")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack message update failed with HTTP " + response.statusCode() + ". Body: " + response.body()
                );
            }

            Map<String, Object> body = objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
            Object okValue = body.get("ok");
            if (!(okValue instanceof Boolean ok) || !ok) {
                String errorCode = body.get("error") instanceof String error ? error : response.body();
                if ("token_expired".equals(errorCode)) {
                    String refreshedToken = refreshSlackBotToken(tenantId, secret);
                    return retryUpdateSlackRootMessage(channelId, messageTs, messageText, refreshedToken);
                }
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack message update failed. Body: " + response.body()
                );
            }

            SlackMessageResult result = new SlackMessageResult();
            result.channelId = body.get("channel") instanceof String postedChannelId ? postedChannelId : channelId;
            result.messageTs = body.get("ts") instanceof String ts ? ts : messageTs;
            return result;
        } catch (IOException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack message update failed: " + exception.getMessage()
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack message update interrupted."
            );
        }
    }

    private SlackMessageResult retryUpdateSlackRootMessage(
        String channelId,
        String messageTs,
        String messageText,
        String botToken
    ) {
        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                "channel", channelId,
                "ts", messageTs,
                "text", messageText
            ));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://slack.com/api/chat.update"))
                .header("Authorization", "Bearer " + botToken)
                .header("Content-Type", "application/json; charset=utf-8")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack message update failed after token refresh with HTTP "
                        + response.statusCode() + ". Body: " + response.body()
                );
            }

            Map<String, Object> body = objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
            Object okValue = body.get("ok");
            if (!(okValue instanceof Boolean ok) || !ok) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack message update failed after token refresh. Body: " + response.body()
                );
            }

            SlackMessageResult result = new SlackMessageResult();
            result.channelId = body.get("channel") instanceof String postedChannelId ? postedChannelId : channelId;
            result.messageTs = body.get("ts") instanceof String ts ? ts : messageTs;
            return result;
        } catch (IOException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack message update failed after token refresh: " + exception.getMessage()
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack message update interrupted after token refresh."
            );
        }
    }

    private SlackMessageResult retryPostTicketToSlack(
        ConnectwiseTicketResponse ticket,
        String channelId,
        String eventTimestamp,
        String botToken
    ) {
        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                "channel", channelId,
                "text", buildSlackMessageText(ticket, eventTimestamp)
            ));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://slack.com/api/chat.postMessage"))
                .header("Authorization", "Bearer " + botToken)
                .header("Content-Type", "application/json; charset=utf-8")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack message post failed after token refresh with HTTP "
                        + response.statusCode() + ". Body: " + response.body()
                );
            }

            Map<String, Object> body = objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
            Object okValue = body.get("ok");
            if (!(okValue instanceof Boolean ok) || !ok) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack message post failed after token refresh. Body: " + response.body()
                );
            }

            SlackMessageResult result = new SlackMessageResult();
            result.channelId = body.get("channel") instanceof String postedChannelId ? postedChannelId : channelId;
            result.messageTs = body.get("ts") instanceof String ts ? ts : null;
            return result;
        } catch (IOException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack message post failed after token refresh: " + exception.getMessage()
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack message post interrupted after token refresh."
            );
        }
    }

    private SlackMessageResult retryPostSlackThreadReply(
        String channelId,
        String threadTs,
        String messageText,
        String botToken
    ) {
        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                "channel", channelId,
                "thread_ts", threadTs,
                "text", messageText
            ));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://slack.com/api/chat.postMessage"))
                .header("Authorization", "Bearer " + botToken)
                .header("Content-Type", "application/json; charset=utf-8")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack thread reply post failed after token refresh with HTTP "
                        + response.statusCode() + ". Body: " + response.body()
                );
            }

            Map<String, Object> body = objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
            Object okValue = body.get("ok");
            if (!(okValue instanceof Boolean ok) || !ok) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack thread reply post failed after token refresh. Body: " + response.body()
                );
            }

            SlackMessageResult result = new SlackMessageResult();
            result.channelId = body.get("channel") instanceof String postedChannelId ? postedChannelId : channelId;
            result.messageTs = body.get("ts") instanceof String ts ? ts : null;
            return result;
        } catch (IOException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack thread reply post failed after token refresh: " + exception.getMessage()
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack thread reply post interrupted after token refresh."
            );
        }
    }

    private String buildSlackMessageText(ConnectwiseTicketResponse ticket, String eventTimestamp) {
        return "*"
            + valueOrFallback(ticket.getSummary(), "ConnectWise ticket")
            + "*\n"
            + "Ticket ID: " + valueOrFallback(ticket.getId() != null ? String.valueOf(ticket.getId()) : null, "Unknown")
            + "\n"
            + "Company: " + valueOrFallback(ticket.getCompany() != null ? ticket.getCompany().getIdentifier() : null, "Unknown company")
            + "\n"
            + "Board: " + valueOrFallback(ticket.getBoard() != null ? ticket.getBoard().getName() : null, "Unassigned")
            + "\n"
            + "Status: " + valueOrFallback(ticket.getStatus() != null ? ticket.getStatus().getName() : null, "Unknown")
            + "\n"
            + "Contact: " + valueOrFallback(ticket.getContact() != null ? ticket.getContact().getName() : null, "Unknown contact")
            + "\n"
            + "Assignee: " + valueOrFallback(ticket.getOwner() != null ? ticket.getOwner().getIdentifier() : null, "Unassigned")
            + "\n"
            + "Received: " + eventTimestamp;
    }

    private String buildSlackThreadReplyText(ConnectwiseTicketTimelineItem item) {
        String kind = item.isInternalAnalysisFlag()
            ? "Internal"
            : item.isResolutionFlag()
                ? "Resolution"
                : "time_entry".equalsIgnoreCase(item.getType())
                    ? "Time Entry"
                    : "Note";

        StringBuilder builder = new StringBuilder();
        builder.append("*").append(kind).append("*");
        if (StringUtils.hasText(item.getId())) {
            builder.append(" | ID: ").append(item.getId().trim());
        }
        if (StringUtils.hasText(item.getAuthor())) {
            builder.append(" | ").append(item.getAuthor().trim());
        }
        builder.append("\n\n");
        builder.append(item.getContent() == null ? "" : item.getContent().trim());
        if ("time_entry".equalsIgnoreCase(item.getType()) && StringUtils.hasText(item.getActualHours())) {
            builder.append("\n\nHours: ").append(item.getActualHours().trim());
        }
        return builder.toString();
    }

    private String buildProviderItemId(ConnectwiseTicketTimelineItem item) {
        if (item == null || !StringUtils.hasText(item.getId())) {
            return null;
        }

        String type = StringUtils.hasText(item.getType()) ? item.getType().trim().toLowerCase() : "note";
        return type + ":" + item.getId().trim();
    }

    private boolean alreadyPosted(TicketLinkage linkage, String providerItemId) {
        if (linkage.getMessageCorrelations() == null || linkage.getMessageCorrelations().isEmpty()) {
            return false;
        }

        for (MessageCorrelation correlation : linkage.getMessageCorrelations()) {
            if (providerItemId.equals(correlation.getProviderItemId())) {
                return true;
            }
        }
        return false;
    }

    private String getValidSlackBotToken(String tenantId, SlackSecretRequest secret) {
        if (!StringUtils.hasText(secret.getBotToken())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Slack bot token not found.");
        }

        if (secret.getTokenExpiresAt() == null) {
            return secret.getBotToken().trim();
        }

        long now = Instant.now().toEpochMilli();
        long timeUntilExpiry = secret.getTokenExpiresAt() - now;
        if (timeUntilExpiry > SLACK_TOKEN_REFRESH_BUFFER_MS) {
            return secret.getBotToken().trim();
        }

        return refreshSlackBotToken(tenantId, secret);
    }

    private String refreshSlackBotToken(String tenantId, SlackSecretRequest secret) {
        if (!StringUtils.hasText(secret.getRefreshToken())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack token expired and no refresh token is available."
            );
        }

        if (!StringUtils.hasText(slackClientId) || !StringUtils.hasText(slackClientSecret)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack token expired and Slack client credentials are not configured on the API service."
            );
        }

        try {
            String authHeader = Base64.getEncoder()
                .encodeToString((slackClientId.trim() + ":" + slackClientSecret.trim()).getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://slack.com/api/oauth.v2.access"))
                .header("Authorization", "Basic " + authHeader)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(
                    "grant_type=refresh_token&refresh_token="
                        + URLEncoder.encode(secret.getRefreshToken().trim(), StandardCharsets.UTF_8)
                ))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack token refresh failed with HTTP " + response.statusCode() + ". Body: " + response.body()
                );
            }

            Map<String, Object> payload = objectMapper.readValue(
                response.body(),
                new TypeReference<Map<String, Object>>() {}
            );
            Object okValue = payload.get("ok");
            if (!(okValue instanceof Boolean ok) || !ok) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack token refresh failed. Body: " + response.body()
                );
            }

            Object accessToken = payload.get("access_token");
            if (!(accessToken instanceof String nextBotToken) || !StringUtils.hasText(nextBotToken)) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Slack token refresh did not return a bot token."
                );
            }

            Object refreshToken = payload.get("refresh_token");
            Object expiresIn = payload.get("expires_in");

            secret.setBotToken(nextBotToken.trim());
            secret.setRefreshToken(refreshToken instanceof String nextRefreshToken && StringUtils.hasText(nextRefreshToken)
                ? nextRefreshToken.trim()
                : secret.getRefreshToken());
            if (expiresIn instanceof Number nextExpiresIn) {
                secret.setTokenExpiresAt(Instant.now().plusSeconds(nextExpiresIn.longValue()).toEpochMilli());
            }
            awsService.saveSlackSecret(secret);
            return secret.getBotToken();
        } catch (IOException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack token refresh failed: " + exception.getMessage()
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Slack token refresh interrupted."
            );
        }
    }

    private String valueOrFallback(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private String firstNonBlank(String first, String second) {
        if (StringUtils.hasText(first)) {
            return first.trim();
        }
        return StringUtils.hasText(second) ? second.trim() : "";
    }

    private String nestedText(JsonNode node, String parentField, String childField) {
        if (node == null || !node.has(parentField) || node.get(parentField).isNull()) {
            return "";
        }

        JsonNode parent = node.get(parentField);
        if (!parent.has(childField) || parent.get(childField).isNull()) {
            return "";
        }
        return parent.get(childField).asText("");
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value).trim();
    }

    private String normalizeMessageLineEndings(String text) {
        return text == null ? "" : text.replace("\r\n", "\n").replace("\r", "\n");
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
