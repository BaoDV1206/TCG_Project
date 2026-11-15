package com.tcgshop.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "product_images")
@Getter
@Setter
@NoArgsConstructor
public class ProductImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false)
    private String url;

    @Column(name = "sort_order")
    private int sortOrder;

    public ProductImage(Product product, String url, int sortOrder) {
        this.product = product;
        this.url = url;
        this.sortOrder = sortOrder;
    }
}
