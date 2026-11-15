package com.tcgshop.service;

import com.tcgshop.common.ApiException;
import com.tcgshop.config.AppProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageService {
    private static final Map<String, String> ALLOWED = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "image/gif", "gif");

    private final Path root;

    public FileStorageService(AppProperties props) {
        this.root = Path.of(props.uploadDir()).toAbsolutePath().normalize();
    }

    /** Lưu ảnh và trả về URL công khai dạng /uploads/yyyy/MM/uuid.ext */
    public String storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("Vui lòng chọn file");
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        String ext = ALLOWED.get(contentType);
        if (ext == null) throw ApiException.badRequest("Chỉ hỗ trợ ảnh JPG, PNG, WEBP, GIF");

        LocalDate d = LocalDate.now();
        String sub = String.format("%d/%02d", d.getYear(), d.getMonthValue());
        String name = UUID.randomUUID().toString().replace("-", "") + "." + ext;
        try (InputStream in = file.getInputStream()) {
            Path dir = root.resolve(sub);
            Files.createDirectories(dir);
            Files.copy(in, dir.resolve(name), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Không thể lưu file", e);
        }
        return "/uploads/" + sub + "/" + name;
    }
}
