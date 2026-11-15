package com.tcgshop.config;

import com.tcgshop.common.ApiException;
import com.tcgshop.entity.User;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class JwtService {
    private final JwtEncoder encoder;
    private final AppProperties props;

    public JwtService(JwtEncoder encoder, AppProperties props) {
        this.encoder = encoder;
        this.props = props;
    }

    public String generate(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("tcg-shop")
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofHours(props.jwt().expirationHours())))
                .subject(user.getUsername())
                .claim("uid", user.getId())
                .claim("roles", List.of(user.getRole().name()))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    /** Lấy id người dùng từ token */
    public static Long uid(Jwt jwt) {
        if (jwt == null) throw ApiException.unauthorized("Vui lòng đăng nhập");
        Object v = jwt.getClaims().get("uid");
        if (v instanceof Number n) return n.longValue();
        throw ApiException.unauthorized("Token không hợp lệ");
    }
}
