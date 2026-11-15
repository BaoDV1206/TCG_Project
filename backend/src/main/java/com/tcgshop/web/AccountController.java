package com.tcgshop.web;

import com.tcgshop.config.JwtService;
import com.tcgshop.dto.AuthDtos.*;
import com.tcgshop.service.FileStorageService;
import com.tcgshop.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AccountController {
    private final UserService userService;
    private final FileStorageService storage;

    public AccountController(UserService userService, FileStorageService storage) {
        this.userService = userService;
        this.storage = storage;
    }

    @GetMapping("/account/me")
    public UserDto me(@AuthenticationPrincipal Jwt jwt) {
        return userService.me(JwtService.uid(jwt));
    }

    @PutMapping("/account/me")
    public UserDto update(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateProfileRequest in) {
        return userService.updateProfile(JwtService.uid(jwt), in);
    }

    @PostMapping("/account/password")
    public Map<String, String> changePassword(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ChangePasswordRequest in) {
        userService.changePassword(JwtService.uid(jwt), in);
        return Map.of("message", "Đổi mật khẩu thành công");
    }

    /** Upload ảnh (dùng cho form đặt hộ và trang quản trị) */
    @PostMapping("/uploads")
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) {
        return Map.of("url", storage.storeImage(file));
    }
}
