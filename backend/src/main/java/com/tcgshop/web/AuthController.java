package com.tcgshop.web;

import com.tcgshop.dto.AuthDtos.*;
import com.tcgshop.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest in) {
        return userService.login(in);
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest in) {
        return userService.register(in);
    }
}
