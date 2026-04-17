package com.dropwise.api.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.util.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.dropwise.api.model.ConnectwiseSecretRequest;
import com.dropwise.api.model.ConnectwiseWebhookRegistrationResponse;
import com.dropwise.api.model.ActivityEvent;
import com.dropwise.api.model.ReorderRulesRequest;
import com.dropwise.api.model.RoutingRule;
import com.dropwise.api.model.SaveSecretResponse;
import com.dropwise.api.model.SlackChannelSummary;
import com.dropwise.api.model.SlackSecretRequest;
import com.dropwise.api.model.TenantConfigRequest;
import com.dropwise.api.model.TenantConfigResponse;
import com.dropwise.api.model.TenantResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AppService {

    private static final char[] TENANT_ID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".toCharArray();
    private static final int TENANT_ID_RANDOM_LENGTH = 16;
    private static final int MAX_ACTIVITY_LIMIT = 500;

    // Dependency on AWSService to handle secret storage operations
    private final AWSService awsService;
    private final ConnectwiseService connectwiseService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Constructs an instance of AppService with the provided AWSService dependency.
     * 
     * @param awsService
     */
    public AppService(AWSService awsService, ConnectwiseService connectwiseService) {
        this.awsService = awsService;
        this.connectwiseService = connectwiseService;
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

    public ConnectwiseWebhookRegistrationResponse registerConnectwiseWebhook(
        String tenantId
    ) throws java.io.IOException, InterruptedException {
        return connectwiseService.registerWebhook(trim(tenantId));
    }

    public List<RoutingRule> listRules(String tenantId) {
        return awsService.listRules(trim(tenantId));
    }

    public RoutingRule createRule(RoutingRule rule) {
        normalizeRule(rule);

        if (!StringUtils.hasText(rule.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant id is required.");
        }

        List<RoutingRule> existingRules = awsService.listRules(rule.getTenantId());
        int nextPriority = existingRules.isEmpty()
            ? 0
            : existingRules.stream().mapToInt(RoutingRule::getPriority).max().orElse(-1) + 1;
        rule.setPriority(nextPriority);

        return awsService.saveRule(rule);
    }

    public RoutingRule updateRule(String tenantId, String ruleId, RoutingRule rule) {
        String normalizedTenantId = trim(tenantId);
        String normalizedRuleId = trim(ruleId);
        normalizeRule(rule);

        RoutingRule existingRule = awsService.loadRule(normalizedTenantId, normalizedRuleId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rule not found."));

        rule.setTenantId(normalizedTenantId);
        rule.setRuleId(normalizedRuleId);
        if (rule.getPriority() < 0) {
            rule.setPriority(existingRule.getPriority());
        }

        return awsService.saveRule(rule);
    }

    public void deleteRule(String tenantId, String ruleId, int priority) {
        String normalizedTenantId = trim(tenantId);
        String normalizedRuleId = trim(ruleId);
        if (!StringUtils.hasText(normalizedTenantId) || !StringUtils.hasText(normalizedRuleId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant id and rule id are required.");
        }

        awsService.deleteRule(normalizedTenantId, normalizedRuleId, priority);
    }

    public List<RoutingRule> reorderRules(ReorderRulesRequest request) {
        String tenantId = trim(request.getTenantId());
        if (!StringUtils.hasText(tenantId) || request.getRuleIds() == null || request.getRuleIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant id and ordered rule ids are required.");
        }

        List<RoutingRule> existingRules = awsService.listRules(tenantId);
        Map<String, RoutingRule> byId = existingRules.stream().collect(
            java.util.stream.Collectors.toMap(RoutingRule::getRuleId, rule -> rule)
        );

        if (byId.size() != request.getRuleIds().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ordered rule list does not match tenant rules.");
        }

        List<RoutingRule> reordered = new ArrayList<>();
        for (int index = 0; index < request.getRuleIds().size(); index++) {
            String ruleId = trim(request.getRuleIds().get(index));
            RoutingRule rule = byId.get(ruleId);
            if (rule == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rule order contains an unknown rule.");
            }

            rule.setPriority(index);
            reordered.add(awsService.saveRule(rule));
        }

        return reordered;
    }

    public List<SlackChannelSummary> listSlackChannels(String tenantId) {
        String normalizedTenantId = trim(tenantId);
        String botToken = awsService.loadSlackBotToken(normalizedTenantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Slack bot token not found."));

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://slack.com/api/conversations.list?exclude_archived=true&limit=1000&types=public_channel,private_channel"))
            .header("Authorization", "Bearer " + botToken)
            .header("Content-Type", "application/json; charset=utf-8")
            .GET()
            .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Slack channel lookup failed.");
            }

            Map<String, Object> payload = objectMapper.readValue(
                response.body(),
                new TypeReference<Map<String, Object>>() {}
            );

            Object okValue = payload.get("ok");
            if (!(okValue instanceof Boolean) || !((Boolean) okValue)) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Slack channel lookup failed.");
            }

            List<SlackChannelSummary> channels = new ArrayList<>();
            Object channelsValue = payload.get("channels");
            if (channelsValue instanceof List<?> channelList) {
                for (Object item : channelList) {
                    if (!(item instanceof Map<?, ?> rawChannel)) {
                        continue;
                    }

                    Object id = rawChannel.get("id");
                    Object name = rawChannel.get("name");
                    if (id instanceof String channelId && name instanceof String channelName) {
                        SlackChannelSummary channel = new SlackChannelSummary();
                        channel.setId(channelId);
                        channel.setName(channelName);
                        channels.add(channel);
                    }
                }
            }

            return channels;
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Slack channel lookup failed.");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Slack channel lookup interrupted.");
        }
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

    private void normalizeRule(RoutingRule rule) {
        if (rule == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rule payload is required.");
        }

        rule.setTenantId(trim(rule.getTenantId()));
        rule.setRuleId(trim(rule.getRuleId()));
        rule.setName(trim(rule.getName()));
        rule.setDescription(trim(rule.getDescription()));
        rule.setSourceSystem(trim(rule.getSourceSystem()));
        rule.setBuilderVersion(trim(rule.getBuilderVersion()));
        rule.setBuilderSnapshotJson(trim(rule.getBuilderSnapshotJson()));

        if (!StringUtils.hasText(rule.getName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rule name is required.");
        }

        if (!StringUtils.hasText(rule.getSourceSystem())) {
            rule.setSourceSystem("connectwise");
        }

        if (rule.getMatch() == null) {
            rule.setMatch(new RoutingRule.Match());
        }
        if (!StringUtils.hasText(rule.getMatch().getJoinOperator())) {
            rule.getMatch().setJoinOperator("AND");
        }
        if (rule.getMatch().getConditions() == null) {
            rule.getMatch().setConditions(new ArrayList<>());
        }
        for (RoutingRule.Condition condition : rule.getMatch().getConditions()) {
            condition.setField(trim(condition.getField()));
            condition.setOperator(trim(condition.getOperator()));
            condition.setValue(trim(condition.getValue()));
        }

        if (rule.getAction() == null) {
            rule.setAction(new RoutingRule.Action());
        }
        rule.getAction().setType(trim(rule.getAction().getType()));
        rule.getAction().setTargetChannelId(trim(rule.getAction().getTargetChannelId()));
        rule.getAction().setTargetAssignee(trim(rule.getAction().getTargetAssignee()));
        if (!StringUtils.hasText(rule.getAction().getType())) {
            rule.getAction().setType("route_to_slack");
        }
        if (!StringUtils.hasText(rule.getAction().getTargetChannelId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Slack destination is required.");
        }
    }
}
