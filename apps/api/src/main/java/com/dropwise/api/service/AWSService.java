package com.dropwise.api.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.dropwise.api.model.ConnectwiseSecretRequest;
import com.dropwise.api.model.SlackSecretRequest;
import com.dropwise.api.model.TenantConfigRequest;
import com.dropwise.api.model.TenantConfigResponse;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.CreateSecretRequest;
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
    
    public AWSService(
        @Value("${aws.region:us-east-1}") String awsRegion,
        @Value("${aws.secrets-prefix:dropwise}") String secretsPrefix,
        @Value("${aws.dynamodb-table}") String dynamoDbTable
    ) {
        Region region = Region.of(StringUtils.hasText(awsRegion) ? awsRegion : "us-east-1");
        this.secretsManagerClient = SecretsManagerClient.builder().region(region).build();
        this.dynamoDbClient = DynamoDbClient.builder().region(region).build();
        this.objectMapper = new ObjectMapper();
        this.secretsPrefix = secretsPrefix;
        this.dynamoDbTable = dynamoDbTable;
    }

    public String saveConnectwiseSecret(ConnectwiseSecretRequest request) {
        String secretName = secretName(request.getTenantId(), "connectwise");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("clientId", request.getClientId());
        payload.put("publicKey", request.getPublicKey());
        payload.put("privateKey", request.getPrivateKey());
        writeSecret(secretName, payload);
        return secretName;
    }

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

    public TenantConfigResponse saveTenantConfig(TenantConfigRequest request) {
        String now = Instant.now().toString();
        Optional<TenantConfigResponse> existingConfig = loadTenantConfig(request.getTenantId());
        String createdAt = existingConfig.map(TenantConfigResponse::getCreatedAt).orElse(now);

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

        return fromTenantConfigItem(item);
    }

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

    private String secretName(String tenantId, String provider) {
        return secretsPrefix + "/" + tenantId + "/" + provider;
    }

    private String tenantPartitionKey(String tenantId) {
        return "TENANT#" + tenantId;
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

    private String stringValue(Map<String, AttributeValue> item, String key) {
        AttributeValue value = item.get(key);
        return value == null ? null : value.s();
    }

    private boolean booleanValue(Map<String, AttributeValue> item, String key) {
        AttributeValue value = item.get(key);
        return value != null && Boolean.TRUE.equals(value.bool());
    }
}
