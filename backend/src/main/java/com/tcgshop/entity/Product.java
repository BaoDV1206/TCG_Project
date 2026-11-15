package com.tcgshop.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_id")
    private CardSet cardSet;

    @Column(nullable = false)
    private String language = "EN";

    /** null = hiển thị "Liên hệ" */
    private BigDecimal price;

    @Column(name = "original_price")
    private BigDecimal originalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status = ProductStatus.IN_STOCK;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "deposit_percent")
    private Integer depositPercent;

    /** Tổng số suất đặt trước, null = không giới hạn */
    @Column(name = "preorder_limit")
    private Integer preorderLimit;

    /** Số lượng tối đa mỗi khách được đặt trước, null = không giới hạn */
    @Column(name = "per_user_limit")
    private Integer perUserLimit;

    private String description;

    /** Mỗi dòng dạng "Tên: Giá trị" */
    private String specs;

    private boolean featured;

    @Column(name = "is_new")
    private boolean newArrival;

    private boolean active = true;

    @Column(name = "view_count")
    private long viewCount;

    @Column(name = "search_text")
    private String searchText;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<ProductImage> images = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }
}
