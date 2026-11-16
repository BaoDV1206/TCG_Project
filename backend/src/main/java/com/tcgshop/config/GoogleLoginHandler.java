package com.tcgshop.config;

import com.tcgshop.common.ApiException;
import com.tcgshop.entity.User;
import com.tcgshop.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Xử lý kết quả sau khi Google xác thực xong:
 * tìm / tạo tài khoản rồi chuyển về frontend kèm JWT của shop.
 * Token đặt sau dấu # để không bị ghi vào log của nginx / Cloudflare.
 */
@Component
public class GoogleLoginHandler implements AuthenticationSuccessHandler, AuthenticationFailureHandler {
    private static final Logger log = LoggerFactory.getLogger(GoogleLoginHandler.class);
    static final String CALLBACK_PAGE = "/dang-nhap/google";
    static final String LOGIN_PAGE = "/dang-nhap";

    private final UserService userService;
    private final JwtService jwtService;

    public GoogleLoginHandler(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req, HttpServletResponse res, Authentication auth) throws IOException {
        String target;
        try {
            OAuth2User g = (OAuth2User) auth.getPrincipal();
            User u = userService.loginWithGoogle(
                    g.getAttribute("sub"),
                    g.getAttribute("email"),
                    Boolean.TRUE.equals(g.getAttribute("email_verified")),
                    g.getAttribute("name"),
                    g.getAttribute("picture"));
            target = CALLBACK_PAGE + "#token=" + jwtService.generate(u);
        } catch (ApiException e) {
            target = errorTarget(e.getMessage());
        }
        finish(req, res, target);
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest req, HttpServletResponse res, AuthenticationException e) throws IOException {
        log.warn("Đăng nhập Google thất bại: {}", e.getMessage());
        finish(req, res, errorTarget("Đăng nhập bằng Google không thành công, vui lòng thử lại"));
    }

    private static String errorTarget(String message) {
        return LOGIN_PAGE + "?loi=" + URLEncoder.encode(message, StandardCharsets.UTF_8);
    }

    /** phiên tạm chỉ dùng trong lúc chuyển qua lại với Google -> xóa đi, web vẫn dùng JWT */
    private static void finish(HttpServletRequest req, HttpServletResponse res, String target) throws IOException {
        SecurityContextHolder.clearContext();
        HttpSession session = req.getSession(false);
        if (session != null) session.invalidate();
        res.sendRedirect(target);
    }
}
