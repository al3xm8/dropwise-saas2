package com.dropwise.api.service;

import java.security.SecureRandom;

import org.springframework.stereotype.Service;

import com.dropwise.api.model.ConnectwiseSecretRequest;
import com.dropwise.api.model.SaveSecretResponse;
import com.dropwise.api.model.SlackSecretRequest;
import com.dropwise.api.model.TenantResponse;

@Service
public class AppService {

    private static final char[] TENANT_ID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".toCharArray();
    private static final int TENANT_ID_RANDOM_LENGTH = 16;

    // Dependency on AWSService to handle secret storage operations
    private final AWSService awsService;
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Constructs an instance of AppService with the provided AWSService dependency.
     * 
     * @param awsService
     */
    public AppService(AWSService awsService) {
        this.awsService = awsService;
    }

    public TenantResponse createTenant() {
        return new TenantResponse(generateTenantId());
    }

    public String health() {
        return "ok";
    }

    /**
     * Saves the provided Connectwise secret for the specified tenant and returns the generated secret name.
     * 
     * @param request the request containing the Connectwise secret details and tenant ID
     * @return the generated secret name wrapped in a SaveSecretResponse
     */
    
    public SaveSecretResponse saveConnectwiseSecret(ConnectwiseSecretRequest request) {
        
        request.setTenantId(trim(request.getTenantId()));
        request.setClientId(trim(request.getClientId()));
        request.setPublicKey(trim(request.getPublicKey()));
        request.setPrivateKey(trim(request.getPrivateKey()));

        String secretName = awsService.saveConnectwiseSecret(request);
        return new SaveSecretResponse(secretName);
    }

    /**
     * Saves the provided Slack secret for the specified tenant and returns the generated secret name.
     *
     * @param request the request containing the Slack secret details and tenant ID
     * @return the generated secret name wrapped in a SaveSecretResponse
     */

    public SaveSecretResponse saveSlackSecret(SlackSecretRequest request) {

        request.setTenantId(trim(request.getTenantId()));
        request.setWorkspaceId(trim(request.getWorkspaceId()));
        request.setBotToken(trim(request.getBotToken()));
        request.setRefreshToken(trim(request.getRefreshToken()));

        String secretName = awsService.saveSlackSecret(request);
        return new SaveSecretResponse(secretName);
    }

    private String generateTenantId() {
        return "tenant_" + encodeTimestamp(System.currentTimeMillis()) + randomSuffix();
    }

    private String encodeTimestamp(long timestamp) {
        char[] encoded = new char[10];
        long value = timestamp;

        for (int index = encoded.length - 1; index >= 0; index--) {
            encoded[index] = TENANT_ID_ALPHABET[(int) (value & 31)];
            value = value >>> 5;
        }

        return new String(encoded);
    }

    private String randomSuffix() {
        char[] suffix = new char[TENANT_ID_RANDOM_LENGTH];

        for (int index = 0; index < suffix.length; index++) {
            suffix[index] = TENANT_ID_ALPHABET[secureRandom.nextInt(TENANT_ID_ALPHABET.length)];
        }

        return new String(suffix);
    }

    /**
     * Trims the provided string value, returning null if the value is null or empty.
     *
     * @param value the string value to trim
     * @return the trimmed string value or null if the input is null or empty
     */

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
