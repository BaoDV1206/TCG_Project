package com.tcgshop.web.admin;

import com.tcgshop.common.PageResponse;
import com.tcgshop.config.JwtService;
import com.tcgshop.dto.AuthDtos.UserDto;
import com.tcgshop.entity.Role;
import com.tcgshop.service.UserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public PageResponse<UserDto> list(@RequestParam(required = false) String q,
                                      @RequestParam(required = false) String role,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return userService.adminList(q, role, page, size);
    }

    @GetMapping("/{id}")
    public UserDto get(@PathVariable Long id) {
        return userService.adminGet(id);
    }

    @PatchMapping("/{id}/enabled")
    public UserDto setEnabled(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestParam boolean value) {
        return userService.setEnabled(JwtService.uid(jwt), id, value);
    }

    @PatchMapping("/{id}/role")
    public UserDto setRole(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestParam Role value) {
        return userService.setRole(JwtService.uid(jwt), id, value);
    }
}
