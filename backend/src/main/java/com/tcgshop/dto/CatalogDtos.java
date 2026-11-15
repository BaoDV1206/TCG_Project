package com.tcgshop.dto;

import com.tcgshop.entity.Banner;
import com.tcgshop.entity.Brand;
import com.tcgshop.entity.CardSet;
import com.tcgshop.entity.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public final class CatalogDtos {
    private CatalogDtos() {
    }

    public record BrandDto(Long id, String name, String slug, String logoUrl, String color, int sortOrder, boolean active) {
        public static BrandDto of(Brand b) {
            return new BrandDto(b.getId(), b.getName(), b.getSlug(), b.getLogoUrl(), b.getColor(), b.getSortOrder(), b.isActive());
        }
    }

    public record BrandInput(@NotBlank(message = "Vui lòng nhập tên thương hiệu") String name, String slug,
                             String logoUrl, String color, Integer sortOrder, Boolean active) {
    }

    public record CategoryDto(Long id, String name, String slug, int sortOrder) {
        public static CategoryDto of(Category c) {
            return new CategoryDto(c.getId(), c.getName(), c.getSlug(), c.getSortOrder());
        }
    }

    public record CategoryInput(@NotBlank(message = "Vui lòng nhập tên loại") String name, String slug, Integer sortOrder) {
    }

    public record SetDto(Long id, Long brandId, String brandName, String brandSlug, String brandColor,
                         String code, String name, String alias, String slug, LocalDate releaseDate,
                         String imageUrl, String description, long productCount) {
        public static SetDto of(CardSet s, long productCount) {
            Brand b = s.getBrand();
            return new SetDto(s.getId(), b.getId(), b.getName(), b.getSlug(), b.getColor(), s.getCode(), s.getName(),
                    s.getAlias(), s.getSlug(), s.getReleaseDate(), s.getImageUrl(), s.getDescription(), productCount);
        }
    }

    public record SetInput(@NotNull(message = "Vui lòng chọn thương hiệu") Long brandId,
                           String code,
                           @NotBlank(message = "Vui lòng nhập tên set") String name,
                           String alias, String slug, LocalDate releaseDate, String imageUrl, String description) {
    }

    public record BannerDto(Long id, String title, String subtitle, String imageUrl, String link, String bgColor,
                            String position, int sortOrder, boolean active) {
        public static BannerDto of(Banner b) {
            return new BannerDto(b.getId(), b.getTitle(), b.getSubtitle(), b.getImageUrl(), b.getLink(), b.getBgColor(),
                    b.getPosition(), b.getSortOrder(), b.isActive());
        }
    }

    public record BannerInput(String title, String subtitle, String imageUrl, String link, String bgColor,
                              @NotBlank String position, Integer sortOrder, Boolean active) {
    }
}
