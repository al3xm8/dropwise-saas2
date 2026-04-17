package com.dropwise.api.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dropwise.api.service.ConnectwiseService;

@RestController
@RequestMapping("/api/connectwise")
public class ConnectwiseController {

    private final ConnectwiseService connectwiseService;

    public ConnectwiseController(ConnectwiseService connectwiseService) {
        this.connectwiseService = connectwiseService;
    }

    @PostMapping("/events")
    public ResponseEntity<String> receiveEvent(@RequestParam(value = "recordId", required = false) String recordId, @RequestBody Map<String, Object> payload) throws IOException, InterruptedException {
        return ResponseEntity.ok(connectwiseService.onNewEvent(recordId, payload));
    }
}
