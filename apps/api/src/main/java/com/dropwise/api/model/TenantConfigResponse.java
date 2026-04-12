package com.dropwise.api.model;

public class TenantConfigResponse {
    private String tenantId;
    private String connectwiseSite;
    private String connectwiseCompanyId;
    private String slackWorkspaceId;
    private String defaultChannelId;
    private boolean connectwiseConnected;
    private boolean slackConnected;
    private boolean botInvited;
    private boolean onboardingCompleted;
    private String createdAt;
    private String updatedAt;

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getConnectwiseSite() {
        return connectwiseSite;
    }

    public void setConnectwiseSite(String connectwiseSite) {
        this.connectwiseSite = connectwiseSite;
    }

    public String getConnectwiseCompanyId() {
        return connectwiseCompanyId;
    }

    public void setConnectwiseCompanyId(String connectwiseCompanyId) {
        this.connectwiseCompanyId = connectwiseCompanyId;
    }

    public String getSlackWorkspaceId() {
        return slackWorkspaceId;
    }

    public void setSlackWorkspaceId(String slackWorkspaceId) {
        this.slackWorkspaceId = slackWorkspaceId;
    }

    public String getDefaultChannelId() {
        return defaultChannelId;
    }

    public void setDefaultChannelId(String defaultChannelId) {
        this.defaultChannelId = defaultChannelId;
    }

    public boolean isConnectwiseConnected() {
        return connectwiseConnected;
    }

    public void setConnectwiseConnected(boolean connectwiseConnected) {
        this.connectwiseConnected = connectwiseConnected;
    }

    public boolean isSlackConnected() {
        return slackConnected;
    }

    public void setSlackConnected(boolean slackConnected) {
        this.slackConnected = slackConnected;
    }

    public boolean isBotInvited() {
        return botInvited;
    }

    public void setBotInvited(boolean botInvited) {
        this.botInvited = botInvited;
    }

    public boolean isOnboardingCompleted() {
        return onboardingCompleted;
    }

    public void setOnboardingCompleted(boolean onboardingCompleted) {
        this.onboardingCompleted = onboardingCompleted;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
