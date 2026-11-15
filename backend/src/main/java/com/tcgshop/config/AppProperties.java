package com.tcgshop.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, String uploadDir, List<String> corsOrigins, Admin admin) {
    public record Jwt(String secret, long expirationHours) {
    }

    public record Admin(String username, String password) {
    }
}
