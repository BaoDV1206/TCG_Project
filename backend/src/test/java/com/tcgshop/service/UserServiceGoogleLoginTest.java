package com.tcgshop.service;

import com.tcgshop.common.ApiException;
import com.tcgshop.config.JwtService;
import com.tcgshop.entity.Role;
import com.tcgshop.entity.User;
import com.tcgshop.repository.ServiceRequestRepository;
import com.tcgshop.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/** Kiểm tra logic đăng nhập Google: tìm, liên kết theo email, tạo mới, khóa tài khoản. */
class UserServiceGoogleLoginTest {
    private UserRepository users;
    private UserService service;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        service = new UserService(users, mock(ServiceRequestRepository.class), mock(PasswordEncoder.class), mock(JwtService.class));
        when(users.findByGoogleId(anyString())).thenReturn(Optional.empty());
        when(users.findFirstByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(users.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static User user(String username, String email) {
        User u = new User();
        u.setUsername(username);
        u.setFullName(username);
        u.setEmail(email);
        u.setPassword("hash");
        return u;
    }

    @Test
    void returningGoogleUserIsFoundByGoogleId() {
        User existing = user("bao", "bao@gmail.com");
        existing.setGoogleId("g-1");
        when(users.findByGoogleId("g-1")).thenReturn(Optional.of(existing));

        User u = service.loginWithGoogle("g-1", "bao@gmail.com", true, "Bao", "https://img/a.png");

        assertSame(existing, u);
        assertEquals("https://img/a.png", u.getAvatarUrl());
        verify(users, never()).save(any());
    }

    @Test
    void verifiedEmailLinksToExistingPasswordAccount() {
        User existing = user("bao", "bao@gmail.com");
        when(users.findFirstByEmailIgnoreCase("bao@gmail.com")).thenReturn(Optional.of(existing));

        User u = service.loginWithGoogle("g-2", "bao@gmail.com", true, "Bao", null);

        assertSame(existing, u);
        assertEquals("g-2", u.getGoogleId());
        assertEquals("hash", u.getPassword(), "mật khẩu cũ phải được giữ nguyên");
    }

    @Test
    void unverifiedEmailMustNotTakeOverExistingAccount() {
        User existing = user("bao", "bao@gmail.com");
        when(users.findFirstByEmailIgnoreCase("bao@gmail.com")).thenReturn(Optional.of(existing));

        ApiException e = assertThrows(ApiException.class,
                () -> service.loginWithGoogle("g-3", "bao@gmail.com", false, "Hacker", null));

        assertEquals(HttpStatus.CONFLICT, e.getStatus());
        assertNull(existing.getGoogleId());
    }

    @Test
    void accountAlreadyLinkedToAnotherGoogleIsRejected() {
        User existing = user("bao", "bao@gmail.com");
        existing.setGoogleId("g-old");
        when(users.findFirstByEmailIgnoreCase("bao@gmail.com")).thenReturn(Optional.of(existing));

        assertThrows(ApiException.class, () -> service.loginWithGoogle("g-new", "bao@gmail.com", true, "Bao", null));
        assertEquals("g-old", existing.getGoogleId());
    }

    @Test
    void newGoogleUserGetsAccountWithoutPassword() {
        when(users.existsByUsernameIgnoreCase("nguyen.van.a")).thenReturn(false);

        User u = service.loginWithGoogle("g-4", "Nguyen.Van.A@gmail.com", true, "Nguyễn Văn A", null);

        verify(users).save(u);
        assertEquals("nguyenvana", u.getUsername());
        assertEquals("Nguyễn Văn A", u.getFullName());
        assertEquals("Nguyen.Van.A@gmail.com", u.getEmail());
        assertEquals(Role.USER, u.getRole());
        assertNull(u.getPassword());
        assertEquals("g-4", u.getGoogleId());
    }

    @Test
    void usernameCollisionGetsNumericSuffix() {
        when(users.existsByUsernameIgnoreCase("bao")).thenReturn(false);
        when(users.existsByUsernameIgnoreCase("baodv")).thenReturn(true);

        User u = service.loginWithGoogle("g-5", "baodv@gmail.com", true, "Bao", null);

        assertTrue(u.getUsername().matches("baodv\\d{4}"), u.getUsername());
    }

    @Test
    void shortNameIsPaddedToValidUsername() {
        User u = service.loginWithGoogle("g-6", "a@x.io", true, null, null);

        assertTrue(u.getUsername().matches("^[a-z0-9_.]{4,30}$"), u.getUsername());
        assertEquals("Khách hàng", u.getFullName());
    }

    @Test
    void lockedAccountCannotSignInWithGoogle() {
        User locked = user("bao", "bao@gmail.com");
        locked.setGoogleId("g-7");
        locked.setEnabled(false);
        when(users.findByGoogleId("g-7")).thenReturn(Optional.of(locked));

        ApiException e = assertThrows(ApiException.class, () -> service.loginWithGoogle("g-7", "bao@gmail.com", true, "Bao", null));
        assertEquals(HttpStatus.FORBIDDEN, e.getStatus());
    }

    @Test
    void missingGoogleIdIsRejected() {
        assertThrows(ApiException.class, () -> service.loginWithGoogle(null, "x@gmail.com", true, "X", null));
    }
}
