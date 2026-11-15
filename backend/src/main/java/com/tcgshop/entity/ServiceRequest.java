package com.tcgshop.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Yêu cầu của khách: Mua / Đặt trước / Đặt hộ */
@Entity
@Table(name = "requests")
@Getter
@Setter
@NoArgsConstructor
public class ServiceRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    /** Tên sản phẩm (lưu lại để không mất nếu sản phẩm bị xóa / dùng cho đặt hộ) */
    @Column(name = "product_name")
    private String productName;

    private int quantity = 1;

    private String note;

    @Column(name = "proxy_url")
    private String proxyUrl;

    @Column(name = "proxy_country")
    private String proxyCountry;

    @Column(name = "proxy_ref_price")
    private BigDecimal proxyRefPrice;

    @Column(name = "proxy_image_url")
    private String proxyImageUrl;

    @Column(name = "quoted_price")
    private BigDecimal quotedPrice;

    @Column(name = "service_fee")
    private BigDecimal serviceFee;

    @Column(name = "admin_note")
    private String adminNote;

    @Column(name = "user_seen")
    private boolean userSeen = true;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<RequestHistory> history = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    public void addHistory(RequestStatus from, RequestStatus to, String note, String by) {
        RequestHistory h = new RequestHistory();
        h.setRequest(this);
        h.setFromStatus(from);
        h.setToStatus(to);
        h.setNote(note);
        h.setChangedBy(by);
        history.add(h);
    }
}
