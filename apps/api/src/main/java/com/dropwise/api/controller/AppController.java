package com.dropwise.api.controller;

import java.util.Map;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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
import com.dropwise.api.service.AppService;


@RestController
@RequestMapping("/api/app")
public class AppController {


    // Service layer dependency to handle business logic related to app operations
    private final AppService appService;

    /**
     * Constructor for AppController.
     * 
     * @param appService the service to handle app-related operations
     */
    public AppController(AppService appService) {
        this.appService = appService;
    }

    /**
     * Endpoint to create a new tenant. 
     * Returns a TenantResponse containing the generated tenant ID.
     * @return TenantResponse with the generated tenant ID
     */
    @PostMapping("/tenants")
    @ResponseStatus(HttpStatus.CREATED)
    public TenantResponse createTenant() {
        return appService.createTenant();
    }

    /**
     * Endpoint to check the health of the application.
     * @return a map containing the health status of the application
     */
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", appService.health());
    }

    /**
     * Endpoint to load the tenant configuration for a given tenant ID.
     * @param tenantId the ID of the tenant whose configuration is to be loaded
     * @return TenantConfigResponse containing the tenant configuration details
     */
    @GetMapping("/tenant-config/{tenantId}")
    public TenantConfigResponse loadTenantConfig(@PathVariable String tenantId) {
        return appService.loadTenantConfig(tenantId);
    }

    @GetMapping("/activity/{tenantId}")
    public List<ActivityEvent> listActivity(@PathVariable String tenantId, @org.springframework.web.bind.annotation.RequestParam(value = "limit", defaultValue = "25") int limit
    ) {
        return appService.listActivity(tenantId, limit);
    }

    @GetMapping("/rules/{tenantId}")
    public List<RoutingRule> listRules(@PathVariable String tenantId) {
        return appService.listRules(tenantId);
    }

    @PostMapping("/rules")
    @ResponseStatus(HttpStatus.CREATED)
    public RoutingRule createRule(@RequestBody RoutingRule rule) {
        return appService.createRule(rule);
    }

    @PutMapping("/rules/{tenantId}/{ruleId}")
    public RoutingRule updateRule(
        @PathVariable String tenantId,
        @PathVariable String ruleId,
        @RequestBody RoutingRule rule
    ) {
        return appService.updateRule(tenantId, ruleId, rule);
    }

    @DeleteMapping("/rules/{tenantId}/{ruleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRule(
        @PathVariable String tenantId,
        @PathVariable String ruleId,
        @RequestParam int priority
    ) {
        appService.deleteRule(tenantId, ruleId, priority);
    }

    @PostMapping("/rules/reorder")
    public List<RoutingRule> reorderRules(@RequestBody ReorderRulesRequest request) {
        return appService.reorderRules(request);
    }

    @GetMapping("/slack/channels/{tenantId}")
    public ResponseEntity<?> listSlackChannels(@PathVariable String tenantId) {
        try {
            return ResponseEntity.ok(appService.listSlackChannels(tenantId));
        } catch (ResponseStatusException exception) {
            return ResponseEntity.status(exception.getStatusCode()).body(
                Map.of(
                    "success", false,
                    "message", exception.getReason() == null ? "Slack channel lookup failed." : exception.getReason()
                )
            );
        }
    }

    /**
     * Endpoint to save the tenant configuration for a given tenant ID.
     * Accepts a TenantConfigRequest containing the configuration details and returns a TenantConfigResponse.
     * @param request the request containing the tenant configuration details
     * @return TenantConfigResponse with the saved tenant configuration details
     */
    @PostMapping("/tenant-config")
    @ResponseStatus(HttpStatus.CREATED)
    public TenantConfigResponse saveTenantConfig(@RequestBody TenantConfigRequest request) {
        return appService.saveTenantConfig(request);
    }

    /**
     * Endpoint to save Connectwise secrets for a tenant. 
     * Accepts a ConnectwiseSecretRequest and returns a SaveSecretResponse containing the generated secret name.
     * @param request
     * @return
     */

    @PostMapping("/secrets/connectwise")
    @ResponseStatus(HttpStatus.CREATED)
    public SaveSecretResponse saveConnectwiseSecret(@RequestBody ConnectwiseSecretRequest request) {
        return appService.saveConnectwiseSecret(request);
    }

    @PostMapping("/connectwise/webhook")
    @ResponseStatus(HttpStatus.CREATED)
    public ConnectwiseWebhookRegistrationResponse registerConnectwiseWebhook(
        @RequestBody Map<String, String> request
    ) throws java.io.IOException, InterruptedException {
        return appService.registerConnectwiseWebhook(request.get("tenantId"));
    }

    /**
     * Endpoint to save Slack secrets for a tenant. 
     * Accepts a SlackSecretRequest and returns a SaveSecretResponse containing the generated secret name.
     * @param request
     * @return
     */

    @PostMapping("/secrets/slack")
    @ResponseStatus(HttpStatus.CREATED)
    public SaveSecretResponse saveSlackSecret(@RequestBody SlackSecretRequest request) {
        return appService.saveSlackSecret(request);
    }
}
