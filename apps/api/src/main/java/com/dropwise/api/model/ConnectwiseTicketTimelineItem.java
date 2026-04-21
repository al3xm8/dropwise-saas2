package com.dropwise.api.model;

public class ConnectwiseTicketTimelineItem {
    private String id;
    private String type;
    private String author;
    private String content;
    private String createdAt;
    private boolean detailDescriptionFlag;
    private boolean internalAnalysisFlag;
    private boolean resolutionFlag;
    private String actualHours;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isDetailDescriptionFlag() {
        return detailDescriptionFlag;
    }

    public void setDetailDescriptionFlag(boolean detailDescriptionFlag) {
        this.detailDescriptionFlag = detailDescriptionFlag;
    }

    public boolean isInternalAnalysisFlag() {
        return internalAnalysisFlag;
    }

    public void setInternalAnalysisFlag(boolean internalAnalysisFlag) {
        this.internalAnalysisFlag = internalAnalysisFlag;
    }

    public boolean isResolutionFlag() {
        return resolutionFlag;
    }

    public void setResolutionFlag(boolean resolutionFlag) {
        this.resolutionFlag = resolutionFlag;
    }

    public String getActualHours() {
        return actualHours;
    }

    public void setActualHours(String actualHours) {
        this.actualHours = actualHours;
    }
}
