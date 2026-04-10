package com.dropwise.api.service;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.dropwise.api.model.ConnectwiseSecretRequest;
import com.dropwise.api.model.SlackSecretRequest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.CreateSecretRequest;
import software.amazon.awssdk.services.secretsmanager.model.PutSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.ResourceNotFoundException;

@Service
public class AWSService {

    // AWS Secrets Manager client to interact with AWS Secrets Manager service
    private final SecretsManagerClient secretsManagerClient;
    
    private final ObjectMapper objectMapper;

    private final String secretsPrefix;
    
    public AWSService(@Value("${aws.region:us-east-1}") String awsRegion, @Value("${aws.secrets-prefix:dropwise}") String secretsPrefix) {
        this.secretsManagerClient = SecretsManagerClient.builder().region(Region.of(StringUtils.hasText(awsRegion) ? awsRegion : "us-east-1")).build();
        this.objectMapper = new ObjectMapper();
        this.secretsPrefix = secretsPrefix;
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
}
