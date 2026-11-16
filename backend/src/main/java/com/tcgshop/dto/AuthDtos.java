package com.tcgshop.dto;

import com.tcgshop.entity.Role;
import com.tcgshop.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank(message = "Vui lòng nhập tên đăng nhập") String username,
            @NotBlank(message = "Vui lòng nhập mật khẩu") String password) {
    }

    public record RegisterRequest(
            @NotBlank(message = "Vui lòng nhập họ tên") @Size(max = 100) String fullName,
            @NotBlank(message = "Vui lòng nhập tên đăng nhập")
            @Pattern(regexp = "^[a-zA-Z0-9_.]{4,30}$", message = "Tên đăng nhập 4–30 ký tự, chỉ gồm chữ, số, _ và .")
            String username,
            @Email(message = "Email không hợp lệ") String email,
            @NotBlank(message = "Vui lòng nhập số điện thoại")
            @Pattern(regexp = "^(\\+84|0)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ")
            String phone,
            @NotBlank(message = "Vui lòng nhập mật khẩu") @Size(min = 6, max = 64, message = "Mật khẩu tối thiểu 6 ký tự")
            String password) {
    }

    public record UserDto(Long id, String username, String fullName, String email, String phone, String address,
                          Role role, boolean enabled, LocalDateTime createdAt, Long requestCount,
                          boolean hasPassword, boolean googleLinked, String avatarUrl) {
        public static UserDto of(User u) {
            return of(u, null);
        }

        public static UserDto of(User u, Long requestCount) {
            return new UserDto(u.getId(), u.getUsername(), u.getFullName(), u.getEmail(), u.getPhone(),
                    u.getAddress(), u.getRole(), u.isEnabled(), u.getCreatedAt(), requestCount,
                    u.getPassword() != null, u.getGoogleId() != null, u.getAvatarUrl());
        }
    }

    public record AuthResponse(String token, UserDto user) {
    }

    public record UpdateProfileRequest(
            @NotBlank(message = "Vui lòng nhập họ tên") @Size(max = 100) String fullName,
            @Email(message = "Email không hợp lệ") String email,
            @NotBlank(message = "Vui lòng nhập số điện thoại")
            @Pattern(regexp = "^(\\+84|0)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ")
            String phone,
            @Size(max = 255) String address) {
    }

    public record ChangePasswordRequest(
            String currentPassword,
            @NotBlank @Size(min = 6, max = 64, message = "Mật khẩu mới tối thiểu 6 ký tự") String newPassword) {
    }
}
