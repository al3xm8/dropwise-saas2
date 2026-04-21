package com.dropwise.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dropwise.api.service.SlackEventService;

@RestController
@RequestMapping("/api/slack")
public class SlackController {

    private final SlackEventService slackEventService;

    public SlackController(SlackEventService slackEventService) {
        this.slackEventService = slackEventService;
    }

    @PostMapping("/events")
    public ResponseEntity<String> receiveEvent(
        @RequestHeader(value = "X-Slack-Signature", required = false) String signature,
        @RequestHeader(value = "X-Slack-Request-Timestamp", required = false) String timestamp,
        @RequestBody String rawBody
    ) {
        return slackEventService.handleEvent(signature, timestamp, rawBody);
    }
}
