package com.tcgshop.web.admin;

import com.tcgshop.dto.CatalogDtos.*;
import com.tcgshop.service.CatalogService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Quản lý thương hiệu, loại sản phẩm, set, banner, cài đặt */
@RestController
@RequestMapping("/api/admin")
public class AdminCatalogController {
    private final CatalogService catalog;

    public AdminCatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    // ----- Brands -----
    @GetMapping("/brands")
    public List<BrandDto> brands() {
        return catalog.brands(true);
    }

    @PostMapping("/brands")
    public BrandDto createBrand(@Valid @RequestBody BrandInput in) {
        return catalog.saveBrand(null, in);
    }

    @PutMapping("/brands/{id}")
    public BrandDto updateBrand(@PathVariable Long id, @Valid @RequestBody BrandInput in) {
        return catalog.saveBrand(id, in);
    }

    @DeleteMapping("/brands/{id}")
    public ResponseEntity<Void> deleteBrand(@PathVariable Long id) {
        catalog.deleteBrand(id);
        return ResponseEntity.noContent().build();
    }

    // ----- Categories -----
    @GetMapping("/categories")
    public List<CategoryDto> categories() {
        return catalog.categories();
    }

    @PostMapping("/categories")
    public CategoryDto createCategory(@Valid @RequestBody CategoryInput in) {
        return catalog.saveCategory(null, in);
    }

    @PutMapping("/categories/{id}")
    public CategoryDto updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryInput in) {
        return catalog.saveCategory(id, in);
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        catalog.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ----- Sets -----
    @GetMapping("/sets")
    public List<SetDto> sets(@RequestParam(required = false) String brand) {
        return catalog.sets(brand);
    }

    @PostMapping("/sets")
    public SetDto createSet(@Valid @RequestBody SetInput in) {
        return catalog.saveSet(null, in);
    }

    @PutMapping("/sets/{id}")
    public SetDto updateSet(@PathVariable Long id, @Valid @RequestBody SetInput in) {
        return catalog.saveSet(id, in);
    }

    @DeleteMapping("/sets/{id}")
    public ResponseEntity<Void> deleteSet(@PathVariable Long id) {
        catalog.deleteSet(id);
        return ResponseEntity.noContent().build();
    }

    // ----- Banners -----
    @GetMapping("/banners")
    public List<BannerDto> banners() {
        return catalog.allBanners();
    }

    @PostMapping("/banners")
    public BannerDto createBanner(@Valid @RequestBody BannerInput in) {
        return catalog.saveBanner(null, in);
    }

    @PutMapping("/banners/{id}")
    public BannerDto updateBanner(@PathVariable Long id, @Valid @RequestBody BannerInput in) {
        return catalog.saveBanner(id, in);
    }

    @DeleteMapping("/banners/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable Long id) {
        catalog.deleteBanner(id);
        return ResponseEntity.noContent().build();
    }

    // ----- Settings -----
    @GetMapping("/settings")
    public Map<String, String> settings() {
        return catalog.settings();
    }

    @PutMapping("/settings")
    public Map<String, String> saveSettings(@RequestBody Map<String, String> values) {
        return catalog.saveSettings(values);
    }
}
