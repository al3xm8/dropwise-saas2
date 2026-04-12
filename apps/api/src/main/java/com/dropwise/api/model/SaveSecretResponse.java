package com.dropwise.api.model;

public class SaveSecretResponse {
    private final boolean saved;

    public SaveSecretResponse(boolean saved) {
        this.saved = saved;
    }

    public boolean isSaved() {
        return saved;
    }
}
