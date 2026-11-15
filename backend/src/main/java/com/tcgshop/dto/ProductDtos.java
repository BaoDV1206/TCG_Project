package com.tcgshop.dto;

import com.tcgshop.dto.CatalogDtos.BannerDto;
import com.tcgshop.dto.CatalogDtos.BrandDto;
import com.tcgshop.dto.CatalogDtos.SetDto;
import com.tcgshop.entity.ProductStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class ProductDtos {
    private ProductDtos() {
    }

    public record ProductCardDto(Long id, String name, String slug, String thumbnail,
                                 String brandName, String brandSlug, String brandColor,
                                 String categoryName, String categorySlug, String setCode,
                                 String language, BigDecimal price, BigDecimal originalPrice,
                                 ProductStatus status, LocalDate releaseDate, Integer depositPercent,
                                 Integer remainingSlots, boolean featured, boolean isNew, boolean active) {
    }

    public record ProductDetailDto(Long id, String name, String slug, List<String> images,
                                   Long brandId, String brandName, String brandSlug, String brandColor,
                                   Long categoryId, String categoryName, String categorySlug,
                                   Long setId, String setCode, String setName, String setSlug,
                                   String language, BigDecimal price, BigDecimal originalPrice,
                                   ProductStatus status, LocalDate releaseDate, Integer depositPercent,
                                   Integer preorderLimit, Integer perUserLimit, Integer remainingSlots,
                                   String description, String specs, boolean featured, boolean isNew,
                                   boolean active, long viewCount, LocalDateTime createdAt) {
    }

    public record ProductInput(
            @NotBlank(message = "Vui lòng nhập tên sản phẩm") @Size(max = 200) String name,
            String slug,
            @NotNull(message = "Vui lòng chọn thương hiệu") Long brandId,
            @NotNull(message = "Vui lòng chọn loại sản phẩm") Long categoryId,
            Long setId,
            @NotBlank(message = "Vui lòng chọn ngôn ngữ") String language,
            @PositiveOrZero(message = "Giá không hợp lệ") BigDecimal price,
            @PositiveOrZero(message = "Giá gốc không hợp lệ") BigDecimal originalPrice,
            @NotNull(message = "Vui lòng chọn trạng thái") ProductStatus status,
            LocalDate releaseDate,
            @Min(value = 0, message = "% cọc từ 0–100") @Max(value = 100, message = "% cọc từ 0–100") Integer depositPercent,
            @Positive(message = "Số suất phải lớn hơn 0") Integer preorderLimit,
            @Positive(message = "Giới hạn mỗi khách phải lớn hơn 0") Integer perUserLimit,
            String description,
            String specs,
            boolean featured,
            boolean isNew,
            Boolean active,
            @Size(max = 5, message = "Mỗi sản phẩm tối đa 5 ảnh") List<String> images) {
    }

    public record BrandSection(BrandDto brand, List<ProductCardDto> products) {
    }

    public record HomeDto(List<BannerDto> mainBanners, List<BannerDto> sideBanners,
                          List<ProductCardDto> upcoming, List<ProductCardDto> newArrivals,
                          List<ProductCardDto> featured, List<BrandSection> brandSections) {
    }

    public record SuggestDto(List<SetDto> sets, List<ProductCardDto> products, long total) {
    }
}
