package com.tcgshop.config;

import com.tcgshop.entity.Role;
import com.tcgshop.entity.User;
import com.tcgshop.repository.UserRepository;
import com.tcgshop.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Tạo tài khoản admin + tài khoản demo và tính lại dữ liệu tìm kiếm khi khởi động. */
@Component
public class DataInitializer implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AppProperties props;
    private final ProductService productService;

    public DataInitializer(UserRepository users, PasswordEncoder encoder, AppProperties props, ProductService productService) {
        this.users = users;
        this.encoder = encoder;
        this.props = props;
        this.productService = productService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String adminName = props.admin().username();
        if (!users.existsByUsernameIgnoreCase(adminName)) {
            User admin = new User();
            admin.setUsername(adminName);
            admin.setPassword(encoder.encode(props.admin().password()));
            admin.setFullName("Quản trị viên");
            admin.setPhone("0900000000");
            admin.setRole(Role.ADMIN);
            users.save(admin);
            log.info("Đã tạo tài khoản admin: {}", adminName);
        }
        if (!users.existsByUsernameIgnoreCase("user")) {
            User demo = new User();
            demo.setUsername("user");
            demo.setPassword(encoder.encode("user123"));
            demo.setFullName("Khách hàng Demo");
            demo.setPhone("0911111111");
            demo.setEmail("user@example.com");
            users.save(demo);
            log.info("Đã tạo tài khoản demo: user / user123");
        }
        int updated = productService.rebuildMissingSearchText();
        if (updated > 0) log.info("Đã cập nhật dữ liệu tìm kiếm cho {} sản phẩm", updated);
    }
}
