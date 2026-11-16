package com.tcgshop.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    /** null với tài khoản tạo từ Google và chưa đặt mật khẩu */
    private String password;

    /** mã người dùng Google (claim "sub"), dùng để đăng nhập bằng Google */
    @Column(name = "google_id", unique = true)
    private String googleId;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String email;
    private String phone;
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
