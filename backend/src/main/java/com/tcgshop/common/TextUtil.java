package com.tcgshop.common;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

public final class TextUtil {
    private TextUtil() {
    }

    /** Bỏ dấu tiếng Việt, chữ thường, chỉ giữ chữ/số và khoảng trắng. "OP-09 Tứ Hoàng" -> "op 09 tu hoang" */
    public static String normalize(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        n = n.replace('đ', 'd').replace('Đ', 'D');
        return n.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }

    /** Như normalize nhưng bỏ luôn khoảng trắng. "OP-09" -> "op09" */
    public static String compact(String s) {
        return normalize(s).replace(" ", "");
    }

    public static String slugify(String s) {
        String n = normalize(s).replace(' ', '-');
        if (n.length() > 200) n = n.substring(0, 200);
        return n.isEmpty() ? "item" : n;
    }

    /** Tạo slug không trùng: thêm hậu tố -2, -3... nếu đã tồn tại */
    public static String uniqueSlug(String base, Predicate<String> exists) {
        String slug = slugify(base);
        String candidate = slug;
        int i = 2;
        while (exists.test(candidate)) {
            candidate = slug + "-" + i++;
        }
        return candidate;
    }

    public static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    public static String trimToNull(String s) {
        return isBlank(s) ? null : s.trim();
    }
}
