package com.dropwise.api.service;

import java.security.SecureRandom;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.dropwise.api.model.ConnectwiseSecretRequest;
import com.dropwise.api.model.ActivityEvent;
import com.dropwise.api.model.SaveSecretResponse;
import com.dropwise.api.model.SlackSecretRequest;
import com.dropwise.api.model.TenantConfigRequest;
import com.dropwise.api.model.TenantConfigResponse;
import com.dropwise.api.model.TenantResponse;

@Service
public class AppService {

    private static final char[] TENANT_ID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".toCharArray();
    private static final int TENANT_ID_RANDOM_LENGTH = 16;
    private static final int MAX_ACTIVITY_LIMIT = 100;

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

    /**
     * Creates a new tenant and returns the generated tenant ID.
     *
     * @return the response containing the generated tenant ID
     */
    public TenantResponse createTenant() {
        return new TenantResponse(generateTenantId());
    }

    /**
     * Checks the health of the application.
     *
     * @return "ok" if the application is healthy
     */
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
        request.setConnectwiseSite(trim(request.getConnectwiseSite()));
        request.setClientId(trim(request.getClientId()));
        request.setPublicKey(trim(request.getPublicKey()));
        request.setPrivateKey(trim(request.getPrivateKey()));

        awsService.saveConnectwiseSecret(request);
        return new SaveSecretResponse(true);
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

        awsService.saveSlackSecret(request);
        return new SaveSecretResponse(true);
    }

    /**
     * Saves the tenant configuration details for the specified tenant and returns the saved configuration.
     * 
     * @param request the request containing the tenant configuration details
     * @return the saved tenant configuration wrapped in a TenantConfigResponse
     */

    public TenantConfigResponse saveTenantConfig(TenantConfigRequest request) {
        request.setTenantId(trim(request.getTenantId()));
        request.setConnectwiseSite(trim(request.getConnectwiseSite()));
        request.setConnectwiseCompanyId(trim(request.getConnectwiseCompanyId()));
        request.setSlackWorkspaceId(trim(request.getSlackWorkspaceId()));
        request.setDefaultChannelId(trim(request.getDefaultChannelId()));

        return awsService.saveTenantConfig(request);
    }

    /**
     * Loads the tenant configuration details for the specified tenant ID.
     *
     * @param tenantId the ID of the tenant whose configuration is to be loaded
     * @return the loaded tenant configuration wrapped in a TenantConfigResponse
     * @throws ResponseStatusException if the tenant configuration is not found
     */

    public TenantConfigResponse loadTenantConfig(String tenantId) {
        String normalizedTenantId = trim(tenantId);
        return awsService.loadTenantConfig(normalizedTenantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant config not found."));
    }

    public java.util.List<ActivityEvent> listActivity(String tenantId, int limit) {
        int normalizedLimit = Math.min(Math.max(limit, 1), MAX_ACTIVITY_LIMIT);
        return awsService.listActivityEvents(trim(tenantId), normalizedLimit);
    }

    /**
     * Generates a unique tenant ID by encoding the current timestamp and appending a random suffix.
     * 
     * @return the generated tenant ID
     */

    private String generateTenantId() {
        return "tenant_" + encodeTimestamp(System.currentTimeMillis()) + randomSuffix();
    }

    /**
     * Encodes the provided timestamp into a string representation using a custom alphabet.
     *
     * @param timestamp the timestamp to encode
     * @return the encoded string representation of the timestamp
     */
    private String encodeTimestamp(long timestamp) {
        char[] encoded = new char[10];
        long value = timestamp;

        for (int index = encoded.length - 1; index >= 0; index--) {
            encoded[index] = TENANT_ID_ALPHABET[(int) (value & 31)];
            value = value >>> 5;
        }

        return new String(encoded);
    }
    
    /**
     * Generates a random suffix string of a specified length using a custom alphabet.
     *
     * @return the generated random suffix string
     */
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
