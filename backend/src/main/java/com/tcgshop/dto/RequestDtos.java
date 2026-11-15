package com.tcgshop.dto;

import com.tcgshop.entity.RequestStatus;
import com.tcgshop.entity.RequestType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class RequestDtos {
    private RequestDtos() {
    }

    public record UserMini(Long id, String username, String fullName, String phone, String email, String address) {
    }

    public record HistoryDto(RequestStatus fromStatus, RequestStatus toStatus, String note, String changedBy,
                             LocalDateTime createdAt) {
    }

    public record RequestDto(Long id, String code, RequestType type, RequestStatus status,
                             Long productId, String productSlug, String productName, String thumbnail,
                             String brandName, BigDecimal unitPrice, Integer depositPercent, LocalDate releaseDate,
                             int quantity, String note,
                             String proxyUrl, String proxyCountry, BigDecimal proxyRefPrice, String proxyImageUrl,
                             BigDecimal quotedPrice, BigDecimal serviceFee, String adminNote,
                             boolean userSeen, LocalDateTime createdAt, LocalDateTime updatedAt,
                             UserMini user, List<HistoryDto> history, List<RequestStatus> allowedNext) {
    }

    public record CreateRequestInput(
            @NotNull(message = "Thiếu loại yêu cầu") RequestType type,
            @NotNull(message = "Thiếu sản phẩm") Long productId,
            @Min(value = 1, message = "Số lượng tối thiểu là 1") @Max(value = 999, message = "Số lượng quá lớn") int quantity,
            @Size(max = 1000) String note) {
    }

    public record ProxyRequestInput(
            @Size(max = 1000) String productUrl,
            @Size(max = 255) String productName,
            @NotBlank(message = "Vui lòng chọn nước mua") String country,
            @Min(value = 1, message = "Số lượng tối thiểu là 1") @Max(value = 999) int quantity,
            @PositiveOrZero BigDecimal refPrice,
            String imageUrl,
            @Size(max = 1000) String note) {
    }

    public record TransitionInput(
            @NotNull(message = "Thiếu trạng thái") RequestStatus status,
            @Size(max = 1000) String note,
            @PositiveOrZero BigDecimal quotedPrice,
            @PositiveOrZero BigDecimal serviceFee) {
    }

    public record QuoteResponseInput(boolean accept, @Size(max = 1000) String note) {
    }

    public record RequestSummary(long all, long pending, long processing, long completed, long closed, long unseen) {
    }

    public record DailyStat(LocalDate date, long purchase, long preOrder, long proxy) {
    }

    public record TopProduct(Long productId, String name, String slug, long quantity) {
    }

    public record DashboardDto(long pendingCount, long todayCount, long activeProducts, long userCount,
                               Map<RequestType, Long> pendingByType, List<DailyStat> daily,
                               List<RequestDto> latest, List<TopProduct> topPreorders) {
    }
}
