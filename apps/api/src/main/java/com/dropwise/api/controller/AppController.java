package com.dropwise.api.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.dropwise.api.model.ConnectwiseSecretRequest;
import com.dropwise.api.model.SaveSecretResponse;
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

    @PostMapping("/tenants")
    @ResponseStatus(HttpStatus.CREATED)
    public TenantResponse createTenant() {
        return appService.createTenant();
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", appService.health());
    }

    @GetMapping("/tenant-config/{tenantId}")
    public TenantConfigResponse loadTenantConfig(@PathVariable String tenantId) {
        return appService.loadTenantConfig(tenantId);
    }

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
