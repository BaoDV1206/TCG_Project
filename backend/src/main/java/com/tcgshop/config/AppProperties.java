package com.tcgshop.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, String uploadDir, List<String> corsOrigins, Admin admin, boolean demoUser, Google google) {
    /** Thông tin OAuth client từ Google Cloud Console. Để trống = tắt đăng nhập Google. */
    public record Google(String clientId, String clientSecret) {
        public boolean enabled() {
            return clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank();
        }
    }

    public record Jwt(String secret, long expirationHours) {
    }

    public record Admin(String username, String password) {
    }
}
