package com.tcgshop.web.admin;

import com.tcgshop.common.PageResponse;
import com.tcgshop.dto.ProductDtos.*;
import com.tcgshop.entity.ProductStatus;
import com.tcgshop.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {
    private final ProductService productService;

    public AdminProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public PageResponse<ProductCardDto> list(@RequestParam(required = false) String q,
                                             @RequestParam(required = false) String brand,
                                             @RequestParam(required = false) String category,
                                             @RequestParam(required = false) String set,
                                             @RequestParam(required = false) ProductStatus status,
                                             @RequestParam(required = false) Boolean active,
                                             @RequestParam(required = false) String sort,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        var f = new ProductService.Filter(q, brand, category, set, null, status, null, null, null, null, active, sort);
        return productService.search(f, page, size, true);
    }

    @GetMapping("/{id}")
    public ProductDetailDto get(@PathVariable Long id) {
        return productService.getById(id);
    }

    @PostMapping
    public ProductDetailDto create(@Valid @RequestBody ProductInput in) {
        return productService.create(in);
    }

    @PutMapping("/{id}")
    public ProductDetailDto update(@PathVariable Long id, @Valid @RequestBody ProductInput in) {
        return productService.update(id, in);
    }

    @PatchMapping("/{id}/active")
    public ProductDetailDto setActive(@PathVariable Long id, @RequestParam boolean value) {
        return productService.setActive(id, value);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
