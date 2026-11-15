package com.tcgshop.web;

import com.tcgshop.common.PageResponse;
import com.tcgshop.dto.CatalogDtos.*;
import com.tcgshop.dto.ProductDtos.*;
import com.tcgshop.entity.ProductStatus;
import com.tcgshop.service.CatalogService;
import com.tcgshop.service.ProductService;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** API công khai – không cần đăng nhập */
@RestController
@RequestMapping("/api/public")
public class PublicController {
    private final ProductService productService;
    private final CatalogService catalogService;

    public PublicController(ProductService productService, CatalogService catalogService) {
        this.productService = productService;
        this.catalogService = catalogService;
    }

    @GetMapping("/home")
    public HomeDto home() {
        return productService.home();
    }

    @GetMapping("/brands")
    public List<BrandDto> brands() {
        return catalogService.brands(false);
    }

    @GetMapping("/categories")
    public List<CategoryDto> categories() {
        return catalogService.categories();
    }

    @GetMapping("/sets")
    public List<SetDto> sets(@RequestParam(required = false) String brand) {
        return catalogService.sets(brand);
    }

    @GetMapping("/sets/{slug}")
    public SetDto set(@PathVariable String slug) {
        return catalogService.setBySlug(slug);
    }

    @GetMapping("/products")
    public PageResponse<ProductCardDto> products(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String set,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) Boolean isNew,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var f = new ProductService.Filter(q, brand, category, set, language, status, minPrice, maxPrice,
                featured, isNew, null, sort);
        return productService.search(f, page, size, false);
    }

    @GetMapping("/products/{slug}")
    public ProductDetailDto product(@PathVariable String slug) {
        return productService.getPublicDetail(slug);
    }

    @GetMapping("/products/{slug}/related")
    public List<ProductCardDto> related(@PathVariable String slug) {
        return productService.related(slug);
    }

    @GetMapping("/search/suggest")
    public SuggestDto suggest(@RequestParam(defaultValue = "") String q) {
        return productService.suggest(q);
    }

    @GetMapping("/settings")
    public Map<String, String> settings() {
        return catalogService.settings();
    }
}
