package com.dropwise.api.model;

import java.util.ArrayList;
import java.util.List;

public class ReorderRulesRequest {
    private String tenantId;
    private List<String> ruleIds = new ArrayList<>();

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public List<String> getRuleIds() {
        return ruleIds;
    }

    public void setRuleIds(List<String> ruleIds) {
        this.ruleIds = ruleIds;
    }
}
