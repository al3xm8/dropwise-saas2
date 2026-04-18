package com.dropwise.api.model;

import java.util.ArrayList;
import java.util.List;

public class RoutingRule {
    private String ruleId;
    private String tenantId;
    private int priority;
    private boolean enabled;
    private String name;
    private String description;
    private String sourceSystem;
    private boolean stopProcessing;
    private Match match = new Match();
    private Action action = new Action();
    private String builderVersion;
    private String builderSnapshotJson;
    private String createdAt;
    private String updatedAt;

    public String getRuleId() {
        return ruleId;
    }

    public void setRuleId(String ruleId) {
        this.ruleId = ruleId;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public int getPriority() {
        return priority;
    }

    public void setPriority(int priority) {
        this.priority = priority;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSourceSystem() {
        return sourceSystem;
    }

    public void setSourceSystem(String sourceSystem) {
        this.sourceSystem = sourceSystem;
    }

    public boolean isStopProcessing() {
        return stopProcessing;
    }

    public void setStopProcessing(boolean stopProcessing) {
        this.stopProcessing = stopProcessing;
    }

    public Match getMatch() {
        return match;
    }

    public void setMatch(Match match) {
        this.match = match;
    }

    public Action getAction() {
        return action;
    }

    public void setAction(Action action) {
        this.action = action;
    }

    public String getBuilderVersion() {
        return builderVersion;
    }

    public void setBuilderVersion(String builderVersion) {
        this.builderVersion = builderVersion;
    }

    public String getBuilderSnapshotJson() {
        return builderSnapshotJson;
    }

    public void setBuilderSnapshotJson(String builderSnapshotJson) {
        this.builderSnapshotJson = builderSnapshotJson;
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

    public static class Match {
        private String joinOperator;
        private List<Condition> conditions = new ArrayList<>();

        public String getJoinOperator() {
            return joinOperator;
        }

        public void setJoinOperator(String joinOperator) {
            this.joinOperator = joinOperator;
        }

        public List<Condition> getConditions() {
            return conditions;
        }

        public void setConditions(List<Condition> conditions) {
            this.conditions = conditions;
        }
    }

    public static class Condition {
        private String field;
        private String operator;
        private String value;

        public String getField() {
            return field;
        }

        public void setField(String field) {
            this.field = field;
        }

        public String getOperator() {
            return operator;
        }

        public void setOperator(String operator) {
            this.operator = operator;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }
    }

    public static class Action {
        private String type;
        private String targetChannelId;
        private String targetAssignee;

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getTargetChannelId() {
            return targetChannelId;
        }

        public void setTargetChannelId(String targetChannelId) {
            this.targetChannelId = targetChannelId;
        }

        public String getTargetAssignee() {
            return targetAssignee;
        }

        public void setTargetAssignee(String targetAssignee) {
            this.targetAssignee = targetAssignee;
        }
    }
}
