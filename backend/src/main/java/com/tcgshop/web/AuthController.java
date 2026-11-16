package com.tcgshop.web;

import com.tcgshop.config.AppProperties;
import com.tcgshop.dto.AuthDtos.*;
import com.tcgshop.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;
    private final AppProperties props;

    public AuthController(UserService userService, AppProperties props) {
        this.userService = userService;
        this.props = props;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest in) {
        return userService.login(in);
    }

    /** Các cách đăng nhập đang bật (frontend dùng để hiện / ẩn nút Google) */
    @GetMapping("/providers")
    public Map<String, Boolean> providers() {
        return Map.of("google", props.google().enabled());
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest in) {
        return userService.register(in);
    }
}
