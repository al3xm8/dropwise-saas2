package com.dropwise.api.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.dropwise.api.model.ActivityEvent;
import com.dropwise.api.model.ConnectwiseSecretRequest;
import com.dropwise.api.model.RoutingRule;
import com.dropwise.api.model.SlackSecretRequest;
import com.dropwise.api.model.TenantConfigRequest;
import com.dropwise.api.model.TenantConfigResponse;
import com.dropwise.api.model.TicketSnapshot;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.DeleteItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryResponse;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.CreateSecretRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.PutSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.ResourceNotFoundException;

@Service
public class AWSService {

    // AWS Secrets Manager client to interact with AWS Secrets Manager service
    private final SecretsManagerClient secretsManagerClient;
    private final DynamoDbClient dynamoDbClient;
    
    private final ObjectMapper objectMapper;

    private final String secretsPrefix;
    private final String dynamoDbTable;
    
    /**
     * Constructs an instance of AWSService with the provided configuration values for AWS region, secrets prefix, and DynamoDB table name.
     *
     * @param awsRegion the AWS region to connect to (default is "us-east-1" if not provided)
     * @param secretsPrefix the prefix to use for secret names in AWS Secrets Manager (default is "dropwise" if not provided)
     * @param dynamoDbTable the name of the DynamoDB table to use for tenant configuration storage
     */
    public AWSService(@Value("${aws.region:us-east-1}") String awsRegion, @Value("${aws.secrets-prefix:dropwise}") String secretsPrefix, @Value("${aws.dynamodb-table}") String dynamoDbTable) {
        Region region = Region.of(StringUtils.hasText(awsRegion) ? awsRegion : "us-east-1");
        this.secretsManagerClient = SecretsManagerClient.builder().region(region).build();
        this.dynamoDbClient = DynamoDbClient.builder().region(region).build();
        this.objectMapper = new ObjectMapper();
        this.secretsPrefix = secretsPrefix;
        this.dynamoDbTable = dynamoDbTable;
    }

    /**
     * Saves the provided Connectwise secret for the specified tenant and returns the generated secret name.
     *
     * @param request the request containing the Connectwise secret details and tenant ID
     * @return the generated secret name
     */
    public String saveConnectwiseSecret(ConnectwiseSecretRequest request) {
        String secretName = secretName(request.getTenantId(), "connectwise");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("clientId", request.getClientId());
        payload.put("publicKey", request.getPublicKey());
        payload.put("privateKey", request.getPrivateKey());
        writeSecret(secretName, payload);
        return secretName;
    }

    /**
     * Saves the provided Slack secret for the specified tenant and returns the generated secret name.
     *
     * @param request the request containing the Slack secret details and tenant ID
     * @return the generated secret name
     */
    public String saveSlackSecret(SlackSecretRequest request) {
        String secretName = secretName(request.getTenantId(), "slack");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("workspaceId", request.getWorkspaceId());
        payload.put("botToken", request.getBotToken());
        payload.put("refreshToken", request.getRefreshToken());
        payload.put("tokenExpiresAt", request.getTokenExpiresAt());
        writeSecret(secretName, payload);
        return secretName;
    }

    /**
     * Saves the tenant configuration details for the specified tenant and returns the saved configuration.
     *
     * @param request the request containing the tenant configuration details
     * @return the saved tenant configuration
     */
    public TenantConfigResponse saveTenantConfig(TenantConfigRequest request) {
        String now = Instant.now().toString();
        Optional<TenantConfigResponse> existingConfig = loadTenantConfig(request.getTenantId());
        String createdAt = existingConfig.map(TenantConfigResponse::getCreatedAt).orElse(now);
        String previousConnectwiseCompanyId = existingConfig
            .map(TenantConfigResponse::getConnectwiseCompanyId)
            .orElse(null);

        Map<String, AttributeValue> item = new LinkedHashMap<>();
        item.put("pk", stringAttribute(tenantPartitionKey(request.getTenantId())));
        item.put("sk", stringAttribute("CONFIG"));
        item.put("itemType", stringAttribute("TENANT_CONFIG"));
        item.put("tenantId", stringAttribute(request.getTenantId()));
        item.put("connectwiseConnected", booleanAttribute(request.isConnectwiseConnected()));
        item.put("slackConnected", booleanAttribute(request.isSlackConnected()));
        item.put("botInvited", booleanAttribute(request.isBotInvited()));
        item.put("onboardingCompleted", booleanAttribute(request.isOnboardingCompleted()));
        item.put("createdAt", stringAttribute(createdAt));
        item.put("updatedAt", stringAttribute(now));
        putIfPresent(item, "connectwiseSite", request.getConnectwiseSite());
        putIfPresent(item, "connectwiseCompanyId", request.getConnectwiseCompanyId());
        putIfPresent(item, "slackWorkspaceId", request.getSlackWorkspaceId());
        putIfPresent(item, "defaultChannelId", request.getDefaultChannelId());

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(dynamoDbTable)
            .item(item)
            .build());

        syncConnectwiseLookup(
            request.getTenantId(),
            previousConnectwiseCompanyId,
            request.getConnectwiseCompanyId(),
            now
        );

        return fromTenantConfigItem(item);
    }

    /**
     * Loads the tenant configuration details for the specified tenant ID.
     *
     * @param tenantId the ID of the tenant whose configuration is to be loaded
     * @return an Optional containing the loaded tenant configuration if found, or empty if not found
     */
    public Optional<TenantConfigResponse> loadTenantConfig(String tenantId) {
        Map<String, AttributeValue> item = dynamoDbClient.getItem(GetItemRequest.builder()
            .tableName(dynamoDbTable)
            .key(Map.of(
                "pk", stringAttribute(tenantPartitionKey(tenantId)),
                "sk", stringAttribute("CONFIG")
            ))
            .build()).item();

        if (item == null || item.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(fromTenantConfigItem(item));
    }

    public Optional<String> resolveTenantIdByConnectwiseCompanyId(String connectwiseCompanyId) {
        if (!StringUtils.hasText(connectwiseCompanyId)) {
            return Optional.empty();
        }

        Map<String, AttributeValue> item = dynamoDbClient.getItem(GetItemRequest.builder()
            .tableName(dynamoDbTable)
            .key(Map.of(
                "pk", stringAttribute(connectwiseLookupPartitionKey(connectwiseCompanyId)),
                "sk", stringAttribute("LOOKUP")
            ))
            .build()).item();

        if (item == null || item.isEmpty()) {
            return Optional.empty();
        }

        return Optional.ofNullable(stringValue(item, "tenantId"));
    }

    public Optional<ConnectwiseService.ConnectwiseCredentials> loadConnectwiseCredentials(String tenantId) {
        Optional<TenantConfigResponse> tenantConfig = loadTenantConfig(tenantId);
        if (tenantConfig.isEmpty()) {
            return Optional.empty();
        }

        String secretName = secretName(tenantId, "connectwise");
        try {
            String secretJson = secretsManagerClient.getSecretValue(GetSecretValueRequest.builder()
                .secretId(secretName)
                .build()).secretString();

            Map<String, String> payload = objectMapper.readValue(
                secretJson,
                new TypeReference<Map<String, String>>() {}
            );

            ConnectwiseService.ConnectwiseCredentials credentials = new ConnectwiseService.ConnectwiseCredentials();
            credentials.setConnectwiseCompanyId(tenantConfig.get().getConnectwiseCompanyId());
            credentials.setConnectwiseSite(tenantConfig.get().getConnectwiseSite());
            credentials.setClientId(payload.get("clientId"));
            credentials.setPublicKey(payload.get("publicKey"));
            credentials.setPrivateKey(payload.get("privateKey"));
            return Optional.of(credentials);
        } catch (ResourceNotFoundException | JsonProcessingException exception) {
            return Optional.empty();
        }
    }

    public TicketSnapshot saveTicketSnapshot(TicketSnapshot snapshot) {
        String now = Instant.now().toString();
        Optional<TicketSnapshot> existingSnapshot = loadTicketSnapshot(
            snapshot.getTenantId(),
            snapshot.getTicketId()
        );
        String createdAt = existingSnapshot.map(TicketSnapshot::getCreatedAt).orElse(now);

        Map<String, AttributeValue> item = new LinkedHashMap<>();
        item.put("pk", stringAttribute(tenantPartitionKey(snapshot.getTenantId())));
        item.put("sk", stringAttribute(ticketSortKey(snapshot.getTicketId())));
        item.put("itemType", stringAttribute("TICKET"));
        item.put("tenantId", stringAttribute(snapshot.getTenantId()));
        item.put("ticketId", stringAttribute(snapshot.getTicketId()));
        item.put("sourceSystem", stringAttribute(snapshot.getSourceSystem()));
        item.put("createdAt", stringAttribute(createdAt));
        item.put("updatedAt", stringAttribute(now));
        putIfPresent(item, "summary", snapshot.getSummary());
        putIfPresent(item, "company", snapshot.getCompany());
        putIfPresent(item, "board", snapshot.getBoard());
        putIfPresent(item, "ticketStatus", snapshot.getTicketStatus());
        putIfPresent(item, "contact", snapshot.getContact());
        putIfPresent(item, "assignee", snapshot.getAssignee());
        putIfPresent(item, "lastEventStatus", snapshot.getLastEventStatus());
        putIfPresent(item, "lastEventAt", snapshot.getLastEventAt());
        putIfPresent(item, "lastDestinationLabel", snapshot.getLastDestinationLabel());
        putIfPresent(item, "lastRoutingRuleId", snapshot.getLastRoutingRuleId());

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(dynamoDbTable)
            .item(item)
            .build());

        snapshot.setCreatedAt(createdAt);
        snapshot.setUpdatedAt(now);
        return snapshot;
    }

    public ActivityEvent saveActivityEvent(ActivityEvent event) {
        String now = Instant.now().toString();
        if (!StringUtils.hasText(event.getEventId())) {
            event.setEventId(UUID.randomUUID().toString());
        }
        if (!StringUtils.hasText(event.getCreatedAt())) {
            event.setCreatedAt(now);
        }

        Map<String, AttributeValue> item = new LinkedHashMap<>();
        item.put("pk", stringAttribute(tenantPartitionKey(event.getTenantId())));
        item.put("sk", stringAttribute(eventSortKey(
            event.getCreatedAt(),
            event.getSourceTicketId(),
            event.getEventId()
        )));
        item.put("itemType", stringAttribute("EVENT"));
        item.put("tenantId", stringAttribute(event.getTenantId()));
        item.put("eventId", stringAttribute(event.getEventId()));
        item.put("createdAt", stringAttribute(event.getCreatedAt()));
        putIfPresent(item, "sourceSystem", event.getSourceSystem());
        putIfPresent(item, "sourceTicketId", event.getSourceTicketId());
        putIfPresent(item, "status", event.getStatus());
        putIfPresent(item, "title", event.getTitle());
        putIfPresent(item, "description", event.getDescription());
        putIfPresent(item, "ticketSummary", event.getTicketSummary());
        putIfPresent(item, "board", event.getBoard());
        putIfPresent(item, "ticketStatus", event.getTicketStatus());
        putIfPresent(item, "company", event.getCompany());
        putIfPresent(item, "contact", event.getContact());
        putIfPresent(item, "assignee", event.getAssignee());
        putIfPresent(item, "destinationLabel", event.getDestinationLabel());
        putIfPresent(item, "routingRuleId", event.getRoutingRuleId());

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(dynamoDbTable)
            .item(item)
            .build());

        return event;
    }

    public List<ActivityEvent> listActivityEvents(String tenantId, int limit) {
        QueryResponse response = dynamoDbClient.query(QueryRequest.builder()
            .tableName(dynamoDbTable)
            .keyConditionExpression("pk = :pk AND begins_with(sk, :prefix)")
            .expressionAttributeValues(Map.of(
                ":pk", stringAttribute(tenantPartitionKey(tenantId)),
                ":prefix", stringAttribute("EVENT#")
            ))
            .scanIndexForward(false)
            .limit(Math.max(limit, 1))
            .build());

        List<ActivityEvent> events = new ArrayList<>();
        for (Map<String, AttributeValue> item : response.items()) {
            events.add(fromActivityEventItem(item));
        }
        return events;
    }

    public List<RoutingRule> listRules(String tenantId) {
        QueryResponse response = dynamoDbClient.query(QueryRequest.builder()
            .tableName(dynamoDbTable)
            .keyConditionExpression("pk = :pk AND begins_with(sk, :prefix)")
            .expressionAttributeValues(Map.of(
                ":pk", stringAttribute(tenantPartitionKey(tenantId)),
                ":prefix", stringAttribute("RULE#")
            ))
            .scanIndexForward(true)
            .build());

        List<RoutingRule> rules = new ArrayList<>();
        for (Map<String, AttributeValue> item : response.items()) {
            rules.add(fromRoutingRuleItem(item));
        }
        return rules;
    }

    public Optional<RoutingRule> loadRule(String tenantId, String ruleId) {
        return listRules(tenantId).stream()
            .filter(rule -> ruleId.equals(rule.getRuleId()))
            .findFirst();
    }

    public RoutingRule saveRule(RoutingRule rule) {
        String now = Instant.now().toString();
        if (!StringUtils.hasText(rule.getRuleId())) {
            rule.setRuleId(UUID.randomUUID().toString());
        }

        Optional<RoutingRule> existingRule = loadRule(rule.getTenantId(), rule.getRuleId());
        String createdAt = existingRule.map(RoutingRule::getCreatedAt).orElse(now);

        if (existingRule.isPresent()) {
            String previousKey = ruleSortKey(existingRule.get().getPriority(), existingRule.get().getRuleId());
            String nextKey = ruleSortKey(rule.getPriority(), rule.getRuleId());
            if (!previousKey.equals(nextKey)) {
                dynamoDbClient.deleteItem(DeleteItemRequest.builder()
                    .tableName(dynamoDbTable)
                    .key(Map.of(
                        "pk", stringAttribute(tenantPartitionKey(rule.getTenantId())),
                        "sk", stringAttribute(previousKey)
                    ))
                    .build());
            }
        }

        Map<String, AttributeValue> item = new LinkedHashMap<>();
        item.put("pk", stringAttribute(tenantPartitionKey(rule.getTenantId())));
        item.put("sk", stringAttribute(ruleSortKey(rule.getPriority(), rule.getRuleId())));
        item.put("itemType", stringAttribute("RULE"));
        item.put("tenantId", stringAttribute(rule.getTenantId()));
        item.put("ruleId", stringAttribute(rule.getRuleId()));
        item.put("priority", stringAttribute(String.valueOf(rule.getPriority())));
        item.put("enabled", booleanAttribute(rule.isEnabled()));
        item.put("stopProcessing", booleanAttribute(rule.isStopProcessing()));
        item.put("createdAt", stringAttribute(createdAt));
        item.put("updatedAt", stringAttribute(now));
        putIfPresent(item, "name", rule.getName());
        putIfPresent(item, "description", rule.getDescription());
        putIfPresent(item, "sourceSystem", rule.getSourceSystem());
        putIfPresent(item, "builderVersion", rule.getBuilderVersion());
        putIfPresent(item, "builderSnapshotJson", rule.getBuilderSnapshotJson());
        putIfPresent(item, "matchJson", writeJson(rule.getMatch()));
        putIfPresent(item, "actionJson", writeJson(rule.getAction()));

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(dynamoDbTable)
            .item(item)
            .build());

        rule.setCreatedAt(createdAt);
        rule.setUpdatedAt(now);
        return rule;
    }

    public void deleteRule(String tenantId, String ruleId, int priority) {
        dynamoDbClient.deleteItem(DeleteItemRequest.builder()
            .tableName(dynamoDbTable)
            .key(Map.of(
                "pk", stringAttribute(tenantPartitionKey(tenantId)),
                "sk", stringAttribute(ruleSortKey(priority, ruleId))
            ))
            .build());
    }

    public Optional<String> loadSlackBotToken(String tenantId) {
        String secretName = secretName(tenantId, "slack");
        try {
            String secretJson = secretsManagerClient.getSecretValue(GetSecretValueRequest.builder()
                .secretId(secretName)
                .build()).secretString();

            Map<String, String> payload = objectMapper.readValue(
                secretJson,
                new TypeReference<Map<String, String>>() {}
            );

            return Optional.ofNullable(payload.get("botToken"));
        } catch (ResourceNotFoundException | JsonProcessingException exception) {
            return Optional.empty();
        }
    }

    public Optional<SlackSecretRequest> loadSlackSecret(String tenantId) {
        String secretName = secretName(tenantId, "slack");
        try {
            String secretJson = secretsManagerClient.getSecretValue(GetSecretValueRequest.builder()
                .secretId(secretName)
                .build()).secretString();

            Map<String, String> payload = objectMapper.readValue(
                secretJson,
                new TypeReference<Map<String, String>>() {}
            );

            SlackSecretRequest secret = new SlackSecretRequest();
            secret.setTenantId(tenantId);
            secret.setWorkspaceId(payload.get("workspaceId"));
            secret.setBotToken(payload.get("botToken"));
            secret.setRefreshToken(payload.get("refreshToken"));
            String tokenExpiresAt = payload.get("tokenExpiresAt");
            if (StringUtils.hasText(tokenExpiresAt)) {
                try {
                    secret.setTokenExpiresAt(Long.parseLong(tokenExpiresAt));
                } catch (NumberFormatException exception) {
                    secret.setTokenExpiresAt(null);
                }
            }

            return Optional.of(secret);
        } catch (ResourceNotFoundException | JsonProcessingException exception) {
            return Optional.empty();
        }
    }

    public void saveConnectwiseWebhook(
        String tenantId,
        String webhookId,
        String callbackUrl,
        String description
    ) {
        String now = Instant.now().toString();
        Map<String, AttributeValue> item = new LinkedHashMap<>();
        item.put("pk", stringAttribute(tenantPartitionKey(tenantId)));
        item.put("sk", stringAttribute("CONNECTWISE_WEBHOOK"));
        item.put("itemType", stringAttribute("CONNECTWISE_WEBHOOK"));
        item.put("tenantId", stringAttribute(tenantId));
        item.put("callbackUrl", stringAttribute(callbackUrl));
        item.put("objectId", stringAttribute("1"));
        item.put("type", stringAttribute("Ticket"));
        item.put("level", stringAttribute("Board"));
        item.put("inactiveFlag", booleanAttribute(false));
        item.put("updatedAt", stringAttribute(now));
        putIfPresent(item, "webhookId", webhookId);
        putIfPresent(item, "description", description);

        Map<String, AttributeValue> existing = dynamoDbClient.getItem(GetItemRequest.builder()
            .tableName(dynamoDbTable)
            .key(Map.of(
                "pk", stringAttribute(tenantPartitionKey(tenantId)),
                "sk", stringAttribute("CONNECTWISE_WEBHOOK")
            ))
            .build()).item();

        String createdAt = stringValue(existing, "createdAt");
        item.put("createdAt", stringAttribute(StringUtils.hasText(createdAt) ? createdAt : now));

        dynamoDbClient.putItem(PutItemRequest.builder()
            .tableName(dynamoDbTable)
            .item(item)
            .build());
    }

    /**
     * Writes the given payload as a secret to AWS Secrets Manager under the specified secret name.
     * If the secret already exists, it updates the secret value; otherwise, it creates a new secret.
     *
     * @param secretName the name of the secret to create or update
     * @param payload the payload object to be serialized and stored as the secret value
     */
    private void writeSecret(String secretName, Object payload) {
        String json;

        try {
            json = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize secret payload for " + secretName, exception);
        }

        try {
            secretsManagerClient.putSecretValue(PutSecretValueRequest.builder()
                .secretId(secretName)
                .secretString(json)
                .build());
        } catch (ResourceNotFoundException exception) {
            secretsManagerClient.createSecret(CreateSecretRequest.builder()
                .name(secretName)
                .secretString(json)
                .build());
        }
    }

    // Helper methods for constructing secret names, DynamoDB keys, and converting between data formats
    
    private String secretName(String tenantId, String provider) {
        return secretsPrefix + "/" + tenantId + "/" + provider;
    }

    private String tenantPartitionKey(String tenantId) {
        return "TENANT#" + tenantId;
    }

    private String connectwiseLookupPartitionKey(String connectwiseCompanyId) {
        return "CW_COMPANY#" + connectwiseCompanyId;
    }

    private String ticketSortKey(String ticketId) {
        return "TICKET#" + ticketId;
    }

    private String ruleSortKey(int priority, String ruleId) {
        return "RULE#" + String.format("%05d", priority) + "#" + ruleId;
    }

    private String eventSortKey(String createdAt, String ticketId, String eventId) {
        return "EVENT#" + createdAt + "#TICKET#" + ticketId + "#" + eventId;
    }

    private AttributeValue stringAttribute(String value) {
        return AttributeValue.builder().s(value).build();
    }

    private AttributeValue booleanAttribute(boolean value) {
        return AttributeValue.builder().bool(value).build();
    }

    private void putIfPresent(Map<String, AttributeValue> item, String key, String value) {
        if (StringUtils.hasText(value)) {
            item.put(key, stringAttribute(value));
        }
    }

    private void syncConnectwiseLookup(
        String tenantId,
        String previousConnectwiseCompanyId,
        String nextConnectwiseCompanyId,
        String now
    ) {
        if (StringUtils.hasText(previousConnectwiseCompanyId)
            && !previousConnectwiseCompanyId.equals(nextConnectwiseCompanyId)) {
            dynamoDbClient.deleteItem(DeleteItemRequest.builder()
                .tableName(dynamoDbTable)
                .key(Map.of(
                    "pk", stringAttribute(connectwiseLookupPartitionKey(previousConnectwiseCompanyId)),
                    "sk", stringAttribute("LOOKUP")
                ))
                .build());
        }

        if (StringUtils.hasText(nextConnectwiseCompanyId)) {
            Map<String, AttributeValue> lookupItem = new LinkedHashMap<>();
            lookupItem.put("pk", stringAttribute(connectwiseLookupPartitionKey(nextConnectwiseCompanyId)));
            lookupItem.put("sk", stringAttribute("LOOKUP"));
            lookupItem.put("itemType", stringAttribute("CONNECTWISE_COMPANY_LOOKUP"));
            lookupItem.put("tenantId", stringAttribute(tenantId));
            lookupItem.put("connectwiseCompanyId", stringAttribute(nextConnectwiseCompanyId));
            lookupItem.put("updatedAt", stringAttribute(now));

            dynamoDbClient.putItem(PutItemRequest.builder()
                .tableName(dynamoDbTable)
                .item(lookupItem)
                .build());
        }
    }

    /**
     * Converts a DynamoDB item represented as a map of attribute values into a TenantConfigResponse object.
     *
     * @param item the DynamoDB item to convert
     * @return the resulting TenantConfigResponse object
     */
    private TenantConfigResponse fromTenantConfigItem(Map<String, AttributeValue> item) {
        TenantConfigResponse response = new TenantConfigResponse();
        response.setTenantId(stringValue(item, "tenantId"));
        response.setConnectwiseSite(stringValue(item, "connectwiseSite"));
        response.setConnectwiseCompanyId(stringValue(item, "connectwiseCompanyId"));
        response.setSlackWorkspaceId(stringValue(item, "slackWorkspaceId"));
        response.setDefaultChannelId(stringValue(item, "defaultChannelId"));
        response.setConnectwiseConnected(booleanValue(item, "connectwiseConnected"));
        response.setSlackConnected(booleanValue(item, "slackConnected"));
        response.setBotInvited(booleanValue(item, "botInvited"));
        response.setOnboardingCompleted(booleanValue(item, "onboardingCompleted"));
        response.setCreatedAt(stringValue(item, "createdAt"));
        response.setUpdatedAt(stringValue(item, "updatedAt"));
        return response;
    }

    private Optional<TicketSnapshot> loadTicketSnapshot(String tenantId, String ticketId) {
        Map<String, AttributeValue> item = dynamoDbClient.getItem(GetItemRequest.builder()
            .tableName(dynamoDbTable)
            .key(Map.of(
                "pk", stringAttribute(tenantPartitionKey(tenantId)),
                "sk", stringAttribute(ticketSortKey(ticketId))
            ))
            .build()).item();

        if (item == null || item.isEmpty()) {
            return Optional.empty();
        }

        TicketSnapshot response = new TicketSnapshot();
        response.setTenantId(stringValue(item, "tenantId"));
        response.setTicketId(stringValue(item, "ticketId"));
        response.setSourceSystem(stringValue(item, "sourceSystem"));
        response.setSummary(stringValue(item, "summary"));
        response.setCompany(stringValue(item, "company"));
        response.setBoard(stringValue(item, "board"));
        response.setTicketStatus(stringValue(item, "ticketStatus"));
        response.setContact(stringValue(item, "contact"));
        response.setAssignee(stringValue(item, "assignee"));
        response.setLastEventStatus(stringValue(item, "lastEventStatus"));
        response.setLastEventAt(stringValue(item, "lastEventAt"));
        response.setLastDestinationLabel(stringValue(item, "lastDestinationLabel"));
        response.setLastRoutingRuleId(stringValue(item, "lastRoutingRuleId"));
        response.setCreatedAt(stringValue(item, "createdAt"));
        response.setUpdatedAt(stringValue(item, "updatedAt"));
        return Optional.of(response);
    }

    private ActivityEvent fromActivityEventItem(Map<String, AttributeValue> item) {
        ActivityEvent response = new ActivityEvent();
        response.setEventId(stringValue(item, "eventId"));
        response.setTenantId(stringValue(item, "tenantId"));
        response.setSourceSystem(stringValue(item, "sourceSystem"));
        response.setSourceTicketId(stringValue(item, "sourceTicketId"));
        response.setStatus(stringValue(item, "status"));
        response.setTitle(stringValue(item, "title"));
        response.setDescription(stringValue(item, "description"));
        response.setTicketSummary(stringValue(item, "ticketSummary"));
        response.setBoard(stringValue(item, "board"));
        response.setTicketStatus(stringValue(item, "ticketStatus"));
        response.setCompany(stringValue(item, "company"));
        response.setContact(stringValue(item, "contact"));
        response.setAssignee(stringValue(item, "assignee"));
        response.setDestinationLabel(stringValue(item, "destinationLabel"));
        response.setRoutingRuleId(stringValue(item, "routingRuleId"));
        response.setCreatedAt(stringValue(item, "createdAt"));
        return response;
    }

    private RoutingRule fromRoutingRuleItem(Map<String, AttributeValue> item) {
        RoutingRule response = new RoutingRule();
        response.setRuleId(stringValue(item, "ruleId"));
        response.setTenantId(stringValue(item, "tenantId"));
        response.setPriority(intValue(item, "priority"));
        response.setEnabled(booleanValue(item, "enabled"));
        response.setName(stringValue(item, "name"));
        response.setDescription(stringValue(item, "description"));
        response.setSourceSystem(stringValue(item, "sourceSystem"));
        response.setStopProcessing(booleanValue(item, "stopProcessing"));
        response.setBuilderVersion(stringValue(item, "builderVersion"));
        response.setBuilderSnapshotJson(stringValue(item, "builderSnapshotJson"));
        response.setCreatedAt(stringValue(item, "createdAt"));
        response.setUpdatedAt(stringValue(item, "updatedAt"));

        String matchJson = stringValue(item, "matchJson");
        if (StringUtils.hasText(matchJson)) {
            try {
                response.setMatch(objectMapper.readValue(matchJson, RoutingRule.Match.class));
            } catch (JsonProcessingException exception) {
                response.setMatch(new RoutingRule.Match());
            }
        }

        String actionJson = stringValue(item, "actionJson");
        if (StringUtils.hasText(actionJson)) {
            try {
                response.setAction(objectMapper.readValue(actionJson, RoutingRule.Action.class));
            } catch (JsonProcessingException exception) {
                response.setAction(new RoutingRule.Action());
            }
        }

        return response;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize JSON payload.", exception);
        }
    }

    // Helper methods for extracting string and boolean values from DynamoDB items

    private String stringValue(Map<String, AttributeValue> item, String key) {
        AttributeValue value = item.get(key);
        return value == null ? null : value.s();
    }

    private int intValue(Map<String, AttributeValue> item, String key) {
        String value = stringValue(item, key);
        if (!StringUtils.hasText(value)) {
            return 0;
        }

        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    private boolean booleanValue(Map<String, AttributeValue> item, String key) {
        AttributeValue value = item.get(key);
        return value != null && Boolean.TRUE.equals(value.bool());
    }
}
