package com.dropwise.api.model;

public class SaveSecretResponse {
    private final String secretName;

    public SaveSecretResponse(String secretName) {
        this.secretName = secretName;
    }

    public String getSecretName() {
        return secretName;
    }
}
