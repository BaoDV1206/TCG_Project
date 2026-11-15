package com.tcgshop.service;

import com.tcgshop.common.ApiException;
import com.tcgshop.common.TextUtil;
import com.tcgshop.dto.CatalogDtos.*;
import com.tcgshop.entity.*;
import com.tcgshop.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class CatalogService {
    private final BrandRepository brands;
    private final CategoryRepository categories;
    private final CardSetRepository sets;
    private final ProductRepository products;
    private final BannerRepository banners;
    private final SettingRepository settings;
    private final ProductService productService;

    public CatalogService(BrandRepository brands, CategoryRepository categories, CardSetRepository sets,
                          ProductRepository products, BannerRepository banners, SettingRepository settings,
                          ProductService productService) {
        this.brands = brands;
        this.categories = categories;
        this.sets = sets;
        this.products = products;
        this.banners = banners;
        this.settings = settings;
        this.productService = productService;
    }

    // ===================== Brand =====================

    public List<BrandDto> brands(boolean includeInactive) {
        return (includeInactive ? brands.findAllByOrderBySortOrderAscNameAsc()
                : brands.findByActiveTrueOrderBySortOrderAscNameAsc()).stream().map(BrandDto::of).toList();
    }

    @Transactional
    public BrandDto saveBrand(Long id, BrandInput in) {
        Brand b = id == null ? new Brand()
                : brands.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy thương hiệu"));
        String slugBase = TextUtil.isBlank(in.slug()) ? in.name() : in.slug();
        if (!TextUtil.slugify(slugBase).equals(b.getSlug())) {
            b.setSlug(TextUtil.uniqueSlug(slugBase, brands::existsBySlug));
        }
        b.setName(in.name().trim());
        b.setLogoUrl(TextUtil.trimToNull(in.logoUrl()));
        b.setColor(TextUtil.trimToNull(in.color()));
        b.setSortOrder(in.sortOrder() == null ? 0 : in.sortOrder());
        if (in.active() != null) b.setActive(in.active());
        brands.save(b);
        if (id != null) productService.rebuildSearchText(products.findByBrandId(id));
        return BrandDto.of(b);
    }

    @Transactional
    public void deleteBrand(Long id) {
        brands.delete(brands.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy thương hiệu")));
        brands.flush();
    }

    // ===================== Category =====================

    public List<CategoryDto> categories() {
        return categories.findAllByOrderBySortOrderAscNameAsc().stream().map(CategoryDto::of).toList();
    }

    @Transactional
    public CategoryDto saveCategory(Long id, CategoryInput in) {
        Category c = id == null ? new Category()
                : categories.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy loại sản phẩm"));
        String slugBase = TextUtil.isBlank(in.slug()) ? in.name() : in.slug();
        if (!TextUtil.slugify(slugBase).equals(c.getSlug())) {
            c.setSlug(TextUtil.uniqueSlug(slugBase, categories::existsBySlug));
        }
        c.setName(in.name().trim());
        c.setSortOrder(in.sortOrder() == null ? 0 : in.sortOrder());
        categories.save(c);
        return CategoryDto.of(c);
    }

    @Transactional
    public void deleteCategory(Long id) {
        categories.delete(categories.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy loại sản phẩm")));
        categories.flush();
    }

    // ===================== Set =====================

    public List<SetDto> sets(String brandSlug) {
        Map<Long, Long> counts = productService.setProductCounts();
        return sets.findAllOrdered().stream()
                .filter(s -> TextUtil.isBlank(brandSlug) || s.getBrand().getSlug().equals(brandSlug))
                .map(s -> SetDto.of(s, counts.getOrDefault(s.getId(), 0L)))
                .toList();
    }

    public SetDto setBySlug(String slug) {
        CardSet s = sets.findBySlug(slug).orElseThrow(() -> ApiException.notFound("Không tìm thấy set"));
        return SetDto.of(s, productService.setProductCounts().getOrDefault(s.getId(), 0L));
    }

    @Transactional
    public SetDto saveSet(Long id, SetInput in) {
        CardSet s = id == null ? new CardSet()
                : sets.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy set"));
        Brand brand = brands.findById(in.brandId()).orElseThrow(() -> ApiException.badRequest("Thương hiệu không tồn tại"));
        String slugBase = !TextUtil.isBlank(in.slug()) ? in.slug()
                : (TextUtil.isBlank(in.code()) ? in.name() : in.code() + " " + in.name());
        if (!TextUtil.slugify(slugBase).equals(s.getSlug())) {
            s.setSlug(TextUtil.uniqueSlug(slugBase, sets::existsBySlug));
        }
        s.setBrand(brand);
        s.setCode(TextUtil.trimToNull(in.code()));
        s.setName(in.name().trim());
        s.setAlias(TextUtil.trimToNull(in.alias()));
        s.setReleaseDate(in.releaseDate());
        s.setImageUrl(TextUtil.trimToNull(in.imageUrl()));
        s.setDescription(TextUtil.trimToNull(in.description()));
        sets.save(s);
        if (id != null) productService.rebuildSearchText(products.findByCardSetId(id));
        return SetDto.of(s, productService.setProductCounts().getOrDefault(s.getId(), 0L));
    }

    @Transactional
    public void deleteSet(Long id) {
        sets.delete(sets.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy set")));
        sets.flush();
    }

    // ===================== Banner =====================

    public List<BannerDto> allBanners() {
        return banners.findAllByOrderByPositionAscSortOrderAsc().stream().map(BannerDto::of).toList();
    }

    @Transactional
    public BannerDto saveBanner(Long id, BannerInput in) {
        Banner b = id == null ? new Banner()
                : banners.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy banner"));
        if (!"MAIN".equals(in.position()) && !"SIDE".equals(in.position())) {
            throw ApiException.badRequest("Vị trí banner không hợp lệ");
        }
        if (TextUtil.isBlank(in.title()) && TextUtil.isBlank(in.imageUrl())) {
            throw ApiException.badRequest("Banner cần có tiêu đề hoặc ảnh");
        }
        b.setTitle(TextUtil.trimToNull(in.title()));
        b.setSubtitle(TextUtil.trimToNull(in.subtitle()));
        b.setImageUrl(TextUtil.trimToNull(in.imageUrl()));
        b.setLink(TextUtil.trimToNull(in.link()));
        b.setBgColor(TextUtil.trimToNull(in.bgColor()));
        b.setPosition(in.position());
        b.setSortOrder(in.sortOrder() == null ? 0 : in.sortOrder());
        if (in.active() != null) b.setActive(in.active());
        banners.save(b);
        return BannerDto.of(b);
    }

    @Transactional
    public void deleteBanner(Long id) {
        banners.deleteById(id);
    }

    // ===================== Settings =====================

    public Map<String, String> settings() {
        Map<String, String> map = new TreeMap<>();
        settings.findAll().forEach(s -> map.put(s.getKey(), s.getValue()));
        return map;
    }

    @Transactional
    public Map<String, String> saveSettings(Map<String, String> values) {
        values.forEach((k, v) -> {
            if (k == null || k.isBlank() || k.length() > 60) return;
            settings.save(new Setting(k.trim(), v));
        });
        return settings();
    }
}
