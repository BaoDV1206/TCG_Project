package com.tcgshop.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "card_sets")
@Getter
@Setter
@NoArgsConstructor
public class CardSet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    private String code;

    @Column(nullable = false)
    private String name;

    /** Tên gọi khác, phân tách bằng dấu phẩy – dùng cho tìm kiếm */
    private String alias;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "image_url")
    private String imageUrl;

    private String description;
}
