package com.dropwise.api.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.dropwise.api.model.ConnectwiseSecretRequest;
import com.dropwise.api.model.SaveSecretResponse;
import com.dropwise.api.model.SlackSecretRequest;
import com.dropwise.api.model.TenantResponse;
import com.dropwise.api.service.AppService;


@RestController
@CrossOrigin(origins = "http://localhost:3000")
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
