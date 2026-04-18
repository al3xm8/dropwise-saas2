package com.dropwise.api.model;

public class TicketSnapshot {
    private String tenantId;
    private String ticketId;
    private String sourceSystem;
    private String summary;
    private String company;
    private String board;
    private String ticketStatus;
    private String contact;
    private String assignee;
    private String lastEventStatus;
    private String lastEventAt;
    private String lastDestinationLabel;
    private String lastRoutingRuleId;
    private String createdAt;
    private String updatedAt;

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getTicketId() {
        return ticketId;
    }

    public void setTicketId(String ticketId) {
        this.ticketId = ticketId;
    }

    public String getSourceSystem() {
        return sourceSystem;
    }

    public void setSourceSystem(String sourceSystem) {
        this.sourceSystem = sourceSystem;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getBoard() {
        return board;
    }

    public void setBoard(String board) {
        this.board = board;
    }

    public String getTicketStatus() {
        return ticketStatus;
    }

    public void setTicketStatus(String ticketStatus) {
        this.ticketStatus = ticketStatus;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public String getAssignee() {
        return assignee;
    }

    public void setAssignee(String assignee) {
        this.assignee = assignee;
    }

    public String getLastEventStatus() {
        return lastEventStatus;
    }

    public void setLastEventStatus(String lastEventStatus) {
        this.lastEventStatus = lastEventStatus;
    }

    public String getLastEventAt() {
        return lastEventAt;
    }

    public void setLastEventAt(String lastEventAt) {
        this.lastEventAt = lastEventAt;
    }

    public String getLastDestinationLabel() {
        return lastDestinationLabel;
    }

    public void setLastDestinationLabel(String lastDestinationLabel) {
        this.lastDestinationLabel = lastDestinationLabel;
    }

    public String getLastRoutingRuleId() {
        return lastRoutingRuleId;
    }

    public void setLastRoutingRuleId(String lastRoutingRuleId) {
        this.lastRoutingRuleId = lastRoutingRuleId;
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
