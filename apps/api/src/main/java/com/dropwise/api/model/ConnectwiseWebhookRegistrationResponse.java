package com.dropwise.api.model;

public class ConnectwiseWebhookRegistrationResponse {
    private boolean success;
    private String webhookId;
    private String message;

    public ConnectwiseWebhookRegistrationResponse() {
    }

    public ConnectwiseWebhookRegistrationResponse(boolean success, String webhookId, String message) {
        this.success = success;
        this.webhookId = webhookId;
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getWebhookId() {
        return webhookId;
    }

    public void setWebhookId(String webhookId) {
        this.webhookId = webhookId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
