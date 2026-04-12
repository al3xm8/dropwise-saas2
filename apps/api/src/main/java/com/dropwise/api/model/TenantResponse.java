package com.dropwise.api.model;

public class TenantResponse {
    private final String tenantId;

    public TenantResponse(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getTenantId() {
        return tenantId;
    }
}
