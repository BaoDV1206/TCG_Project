package com.tcgshop.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "banners")
@Getter
@Setter
@NoArgsConstructor
public class Banner {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String subtitle;

    @Column(name = "image_url")
    private String imageUrl;

    private String link;

    /** CSS background (màu hoặc gradient) – dùng khi không có ảnh */
    @Column(name = "bg_color")
    private String bgColor;

    /** MAIN hoặc SIDE */
    @Column(nullable = false)
    private String position = "MAIN";

    @Column(name = "sort_order")
    private int sortOrder;

    private boolean active = true;
}
