package com.tcgshop.entity;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

public enum RequestStatus {
    PENDING,     // Chờ duyệt
    APPROVED,    // Đã nhận
    QUOTED,      // Đã báo giá (đặt hộ)
    CONFIRMED,   // Khách đã đồng ý giá (đặt hộ)
    PURCHASING,  // Đang mua (đặt hộ)
    ARRIVED,     // Hàng đã về
    COMPLETED,   // Hoàn thành
    REJECTED,    // Từ chối
    CANCELLED;   // Đã hủy

    public static final Set<RequestStatus> TERMINAL = EnumSet.of(COMPLETED, REJECTED, CANCELLED);
    public static final Set<RequestStatus> PROCESSING =
            EnumSet.of(APPROVED, QUOTED, CONFIRMED, PURCHASING, ARRIVED);
    public static final Set<RequestStatus> CLOSED = EnumSet.of(REJECTED, CANCELLED);

    public boolean isTerminal() {
        return TERMINAL.contains(this);
    }

    /** Các trạng thái kế tiếp (không tính REJECTED) mà admin được phép chuyển. */
    public static List<RequestStatus> adminNext(RequestType type, RequestStatus current) {
        return switch (type) {
            case PURCHASE -> switch (current) {
                case PENDING -> List.of(APPROVED);
                case APPROVED -> List.of(COMPLETED);
                default -> List.of();
            };
            case PRE_ORDER -> switch (current) {
                case PENDING -> List.of(APPROVED);
                case APPROVED -> List.of(ARRIVED);
                case ARRIVED -> List.of(COMPLETED);
                default -> List.of();
            };
            case PROXY -> switch (current) {
                case PENDING, QUOTED -> List.of(QUOTED);
                case CONFIRMED -> List.of(PURCHASING);
                case PURCHASING -> List.of(ARRIVED);
                case ARRIVED -> List.of(COMPLETED);
                default -> List.of();
            };
        };
    }
}
