package com.tcgshop.service;

import com.tcgshop.common.ApiException;
import com.tcgshop.common.PageResponse;
import com.tcgshop.common.TextUtil;
import com.tcgshop.config.JwtService;
import com.tcgshop.dto.AuthDtos.*;
import com.tcgshop.entity.Role;
import com.tcgshop.entity.User;
import com.tcgshop.repository.ServiceRequestRepository;
import com.tcgshop.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class UserService {
    private final UserRepository users;
    private final ServiceRequestRepository requests;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    public UserService(UserRepository users, ServiceRequestRepository requests, PasswordEncoder encoder, JwtService jwtService) {
        this.users = users;
        this.requests = requests;
        this.encoder = encoder;
        this.jwtService = jwtService;
    }

    // ===================== Auth =====================

    public AuthResponse login(LoginRequest in) {
        User u = users.findByUsernameIgnoreCase(in.username().trim())
                .filter(x -> x.getPassword() != null && encoder.matches(in.password(), x.getPassword()))
                .orElseThrow(() -> ApiException.unauthorized("Sai tên đăng nhập hoặc mật khẩu"));
        if (!u.isEnabled()) throw ApiException.forbidden("Tài khoản đã bị khóa, vui lòng liên hệ shop");
        return new AuthResponse(jwtService.generate(u), UserDto.of(u));
    }

    @Transactional
    public AuthResponse register(RegisterRequest in) {
        if (users.existsByUsernameIgnoreCase(in.username().trim())) {
            throw ApiException.conflict("Tên đăng nhập đã được sử dụng");
        }
        String email = TextUtil.trimToNull(in.email());
        if (email != null && users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("Email đã được sử dụng");
        }
        User u = new User();
        u.setUsername(in.username().trim());
        u.setPassword(encoder.encode(in.password()));
        u.setFullName(in.fullName().trim());
        u.setEmail(email);
        u.setPhone(in.phone().trim());
        u.setRole(Role.USER);
        users.save(u);
        return new AuthResponse(jwtService.generate(u), UserDto.of(u));
    }

    /**
     * Đăng nhập bằng Google (thông tin đã được Spring Security xác thực với Google).
     * 1. Đã từng đăng nhập Google -> tìm theo googleId.
     * 2. Có tài khoản thường cùng email và Google xác nhận email đã xác minh -> liên kết vào tài khoản đó.
     * 3. Chưa có -> tạo tài khoản mới (không có mật khẩu).
     */
    @Transactional
    public User loginWithGoogle(String googleId, String email, boolean emailVerified, String name, String picture) {
        if (TextUtil.isBlank(googleId)) throw ApiException.unauthorized("Google không trả về thông tin tài khoản");
        email = TextUtil.trimToNull(email);
        User u = users.findByGoogleId(googleId).orElse(null);
        if (u == null && email != null) {
            Optional<User> byEmail = users.findFirstByEmailIgnoreCase(email);
            if (byEmail.isPresent()) {
                if (!emailVerified) {
                    throw ApiException.conflict("Email này đã thuộc một tài khoản khác. Vui lòng đăng nhập bằng mật khẩu.");
                }
                u = byEmail.get();
                if (u.getGoogleId() != null) {
                    throw ApiException.conflict("Tài khoản này đã liên kết với một tài khoản Google khác.");
                }
                u.setGoogleId(googleId);
            }
        }
        if (u == null) {
            u = new User();
            u.setUsername(uniqueUsername(email != null ? email.substring(0, email.indexOf('@') > 0 ? email.indexOf('@') : email.length()) : name));
            u.setFullName(TextUtil.isBlank(name) ? "Khách hàng" : name.trim());
            u.setEmail(emailVerified ? email : null);
            u.setRole(Role.USER);
            u.setGoogleId(googleId);
            users.save(u);
        }
        if (!u.isEnabled()) throw ApiException.forbidden("Tài khoản đã bị khóa, vui lòng liên hệ shop");
        if (!TextUtil.isBlank(picture)) u.setAvatarUrl(picture);
        return u;
    }

    /** Tạo tên đăng nhập hợp lệ (4–30 ký tự a-z 0-9 _ .) và chưa ai dùng */
    private String uniqueUsername(String seed) {
        String base = TextUtil.normalize(seed == null ? "" : seed).replaceAll("[^a-z0-9_.]", "");
        if (base.length() > 20) base = base.substring(0, 20);
        if (base.length() < 4) base = "user" + base;
        String candidate = base;
        Random random = new Random();
        while (users.existsByUsernameIgnoreCase(candidate)) {
            candidate = base + (1000 + random.nextInt(9000));
        }
        return candidate;
    }

    // ===================== Account =====================

    private User find(Long id) {
        return users.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy người dùng"));
    }

    public UserDto me(Long uid) {
        User u = find(uid);
        if (!u.isEnabled()) throw ApiException.forbidden("Tài khoản đã bị khóa");
        return UserDto.of(u);
    }

    @Transactional
    public UserDto updateProfile(Long uid, UpdateProfileRequest in) {
        User u = find(uid);
        String email = TextUtil.trimToNull(in.email());
        if (email != null && users.existsByEmailIgnoreCaseAndIdNot(email, uid)) {
            throw ApiException.conflict("Email đã được sử dụng");
        }
        u.setFullName(in.fullName().trim());
        u.setEmail(email);
        u.setPhone(in.phone().trim());
        u.setAddress(TextUtil.trimToNull(in.address()));
        return UserDto.of(u);
    }

    @Transactional
    public void changePassword(Long uid, ChangePasswordRequest in) {
        User u = find(uid);
        // tài khoản Google chưa có mật khẩu thì được đặt mật khẩu lần đầu không cần mật khẩu cũ
        if (u.getPassword() != null
                && (TextUtil.isBlank(in.currentPassword()) || !encoder.matches(in.currentPassword(), u.getPassword()))) {
            throw ApiException.badRequest("Mật khẩu hiện tại không đúng");
        }
        u.setPassword(encoder.encode(in.newPassword()));
    }

    // ===================== Admin =====================

    public PageResponse<UserDto> adminList(String q, String role, int page, int size) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (!TextUtil.isBlank(q)) {
                String like = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.get("username")), like),
                        cb.like(cb.lower(root.get("fullName")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("email"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("phone"), "")), like)));
            }
            if (!TextUtil.isBlank(role) && !"ALL".equalsIgnoreCase(role)) {
                ps.add(cb.equal(root.get("role"), Role.valueOf(role.toUpperCase(Locale.ROOT))));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
        Page<User> result = users.findAll(spec, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Order.desc("createdAt"))));
        Map<Long, Long> counts = new HashMap<>();
        List<Long> ids = result.getContent().stream().map(User::getId).toList();
        if (!ids.isEmpty()) {
            for (Object[] row : requests.countByUsers(ids)) counts.put((Long) row[0], ((Number) row[1]).longValue());
        }
        return PageResponse.of(result, u -> UserDto.of(u, counts.getOrDefault(u.getId(), 0L)));
    }

    public UserDto adminGet(Long id) {
        User u = find(id);
        return UserDto.of(u, requests.countByUserId(id));
    }

    @Transactional
    public UserDto setEnabled(Long adminId, Long id, boolean enabled) {
        if (adminId.equals(id)) throw ApiException.badRequest("Không thể khóa chính tài khoản của bạn");
        User u = find(id);
        u.setEnabled(enabled);
        return UserDto.of(u, requests.countByUserId(id));
    }

    @Transactional
    public UserDto setRole(Long adminId, Long id, Role role) {
        if (adminId.equals(id)) throw ApiException.badRequest("Không thể đổi quyền của chính bạn");
        User u = find(id);
        u.setRole(role);
        return UserDto.of(u, requests.countByUserId(id));
    }
}
