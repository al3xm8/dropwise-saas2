package com.dropwise.api.model;

import java.util.ArrayList;
import java.util.List;

public class TicketLinkage {
    private String tenantId;
    private String sourceSystem;
    private String sourceTicketId;
    private String destinationSystem;
    private String destinationWorkspaceId;
    private String destinationConversationId;
    private String destinationThreadId;
    private String destinationRootMessageId;
    private String routingRuleId;
    private String status;
    private List<MessageCorrelation> messageCorrelations = new ArrayList<>();
    private String createdAt;
    private String updatedAt;

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getSourceSystem() {
        return sourceSystem;
    }

    public void setSourceSystem(String sourceSystem) {
        this.sourceSystem = sourceSystem;
    }

    public String getSourceTicketId() {
        return sourceTicketId;
    }

    public void setSourceTicketId(String sourceTicketId) {
        this.sourceTicketId = sourceTicketId;
    }

    public String getDestinationSystem() {
        return destinationSystem;
    }

    public void setDestinationSystem(String destinationSystem) {
        this.destinationSystem = destinationSystem;
    }

    public String getDestinationWorkspaceId() {
        return destinationWorkspaceId;
    }

    public void setDestinationWorkspaceId(String destinationWorkspaceId) {
        this.destinationWorkspaceId = destinationWorkspaceId;
    }

    public String getDestinationConversationId() {
        return destinationConversationId;
    }

    public void setDestinationConversationId(String destinationConversationId) {
        this.destinationConversationId = destinationConversationId;
    }

    public String getDestinationThreadId() {
        return destinationThreadId;
    }

    public void setDestinationThreadId(String destinationThreadId) {
        this.destinationThreadId = destinationThreadId;
    }

    public String getDestinationRootMessageId() {
        return destinationRootMessageId;
    }

    public void setDestinationRootMessageId(String destinationRootMessageId) {
        this.destinationRootMessageId = destinationRootMessageId;
    }

    public String getRoutingRuleId() {
        return routingRuleId;
    }

    public void setRoutingRuleId(String routingRuleId) {
        this.routingRuleId = routingRuleId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<MessageCorrelation> getMessageCorrelations() {
        return messageCorrelations;
    }

    public void setMessageCorrelations(List<MessageCorrelation> messageCorrelations) {
        this.messageCorrelations = messageCorrelations;
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
