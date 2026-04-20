package com.dropwise.api.model;

public class MessageCorrelation {
    private String providerItemId;
    private String destinationMessageId;

    public String getProviderItemId() {
        return providerItemId;
    }

    public void setProviderItemId(String providerItemId) {
        this.providerItemId = providerItemId;
    }

    public String getDestinationMessageId() {
        return destinationMessageId;
    }

    public void setDestinationMessageId(String destinationMessageId) {
        this.destinationMessageId = destinationMessageId;
    }
}
