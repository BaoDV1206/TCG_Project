package com.tcgshop.service;

import com.tcgshop.common.ApiException;
import com.tcgshop.common.PageResponse;
import com.tcgshop.common.TextUtil;
import com.tcgshop.dto.CatalogDtos.BannerDto;
import com.tcgshop.dto.CatalogDtos.BrandDto;
import com.tcgshop.dto.CatalogDtos.SetDto;
import com.tcgshop.dto.ProductDtos.*;
import com.tcgshop.entity.*;
import com.tcgshop.repository.*;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ProductService {

    public static final int MAX_IMAGES = 5;

    /** Bộ lọc sản phẩm (các giá trị dạng slug có thể truyền nhiều, phân tách bằng dấu phẩy) */
    public record Filter(String q, String brand, String category, String set, String language,
                         ProductStatus status, BigDecimal minPrice, BigDecimal maxPrice,
                         Boolean featured, Boolean isNew, Boolean active, String sort) {
        public static Filter empty() {
            return new Filter(null, null, null, null, null, null, null, null, null, null, null, null);
        }
    }

    private static final Map<String, String> LANGUAGE_WORDS = Map.of(
            "EN", "tieng anh english",
            "JP", "tieng nhat japan japanese",
            "CN", "tieng trung chinese",
            "VN", "tieng viet vietnamese",
            "KR", "tieng han korean");

    private final ProductRepository products;
    private final BrandRepository brands;
    private final CategoryRepository categories;
    private final CardSetRepository sets;
    private final ServiceRequestRepository requests;
    private final BannerRepository banners;

    public ProductService(ProductRepository products, BrandRepository brands, CategoryRepository categories,
                          CardSetRepository sets, ServiceRequestRepository requests, BannerRepository banners) {
        this.products = products;
        this.brands = brands;
        this.categories = categories;
        this.sets = sets;
        this.requests = requests;
        this.banners = banners;
    }

    // ===================== Truy vấn =====================

    private static List<String> split(String s) {
        return Arrays.stream(s.split(",")).map(String::trim).filter(x -> !x.isEmpty()).toList();
    }

    private Specification<Product> spec(Filter f, boolean adminView) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (!adminView) {
                ps.add(cb.isTrue(root.get("active")));
            } else if (f.active() != null) {
                ps.add(cb.equal(root.get("active"), f.active()));
            }
            if (!TextUtil.isBlank(f.brand())) ps.add(root.get("brand").get("slug").in(split(f.brand())));
            if (!TextUtil.isBlank(f.category())) ps.add(root.get("category").get("slug").in(split(f.category())));
            if (!TextUtil.isBlank(f.set())) ps.add(root.get("cardSet").get("slug").in(split(f.set())));
            if (!TextUtil.isBlank(f.language())) ps.add(root.get("language").in(split(f.language())));
            if (f.status() != null) ps.add(cb.equal(root.get("status"), f.status()));
            if (f.minPrice() != null) ps.add(cb.greaterThanOrEqualTo(root.get("price"), f.minPrice()));
            if (f.maxPrice() != null) ps.add(cb.lessThanOrEqualTo(root.get("price"), f.maxPrice()));
            if (Boolean.TRUE.equals(f.featured())) ps.add(cb.isTrue(root.get("featured")));
            if (Boolean.TRUE.equals(f.isNew())) ps.add(cb.isTrue(root.get("newArrival")));

            String n = TextUtil.normalize(f.q());
            if (!n.isEmpty()) {
                Expression<String> st = root.get("searchText");
                List<Predicate> words = new ArrayList<>();
                for (String w : n.split(" ")) words.add(cb.like(st, "%" + w + "%"));
                List<Predicate> any = new ArrayList<>();
                any.add(cb.and(words.toArray(new Predicate[0])));
                any.add(cb.like(st, "%" + TextUtil.compact(f.q()) + "%"));
                if (n.length() >= 4) {
                    // Tìm gần đúng bằng pg_trgm khi gõ sai chính tả
                    any.add(cb.greaterThan(cb.function("word_similarity", Double.class, cb.literal(n), st), 0.5));
                }
                ps.add(cb.or(any.toArray(new Predicate[0])));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
    }

    private static Sort sortOf(String sort) {
        if (sort == null) sort = "newest";
        return switch (sort) {
            case "price_asc" -> Sort.by(Sort.Order.asc("price"), Sort.Order.desc("id"));
            case "price_desc" -> Sort.by(Sort.Order.desc("price"), Sort.Order.desc("id"));
            case "popular" -> Sort.by(Sort.Order.desc("viewCount"), Sort.Order.desc("id"));
            case "release" -> Sort.by(Sort.Order.asc("releaseDate"), Sort.Order.desc("id"));
            case "name" -> Sort.by(Sort.Order.asc("name"));
            default -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        };
    }

    public PageResponse<ProductCardDto> search(Filter f, int page, int size, boolean adminView) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 60), sortOf(f.sort()));
        Page<Product> result = products.findAll(spec(f, adminView), pageable);
        return PageResponse.of(result, toCards(result.getContent()));
    }

    private List<ProductCardDto> list(Filter f, int size) {
        return search(f, 0, size, false).items();
    }

    // ===================== Mapping =====================

    private Map<Long, Long> usedPreorderSlots(Collection<Product> list) {
        List<Long> ids = list.stream()
                .filter(p -> p.getStatus() == ProductStatus.PRE_ORDER && p.getPreorderLimit() != null)
                .map(Product::getId).toList();
        if (ids.isEmpty()) return Map.of();
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : requests.sumQuantityByProduct(RequestType.PRE_ORDER, RequestStatus.CLOSED, ids)) {
            map.put((Long) row[0], ((Number) row[1]).longValue());
        }
        return map;
    }

    private static Integer remaining(Product p, Map<Long, Long> used) {
        if (p.getStatus() != ProductStatus.PRE_ORDER || p.getPreorderLimit() == null) return null;
        long u = used.getOrDefault(p.getId(), 0L);
        return (int) Math.max(0, p.getPreorderLimit() - u);
    }

    public Integer remainingSlots(Product p) {
        return remaining(p, usedPreorderSlots(List.of(p)));
    }

    private static String thumbnail(Product p) {
        return p.getImages().isEmpty() ? null : p.getImages().get(0).getUrl();
    }

    public List<ProductCardDto> toCards(List<Product> list) {
        Map<Long, Long> used = usedPreorderSlots(list);
        return list.stream().map(p -> new ProductCardDto(
                p.getId(), p.getName(), p.getSlug(), thumbnail(p),
                p.getBrand().getName(), p.getBrand().getSlug(), p.getBrand().getColor(),
                p.getCategory().getName(), p.getCategory().getSlug(),
                p.getCardSet() != null ? p.getCardSet().getCode() : null,
                p.getLanguage(), p.getPrice(), p.getOriginalPrice(), p.getStatus(), p.getReleaseDate(),
                p.getDepositPercent(), remaining(p, used), p.isFeatured(), p.isNewArrival(), p.isActive()
        )).toList();
    }

    private ProductDetailDto toDetail(Product p) {
        CardSet s = p.getCardSet();
        return new ProductDetailDto(
                p.getId(), p.getName(), p.getSlug(),
                p.getImages().stream().map(ProductImage::getUrl).toList(),
                p.getBrand().getId(), p.getBrand().getName(), p.getBrand().getSlug(), p.getBrand().getColor(),
                p.getCategory().getId(), p.getCategory().getName(), p.getCategory().getSlug(),
                s != null ? s.getId() : null, s != null ? s.getCode() : null,
                s != null ? s.getName() : null, s != null ? s.getSlug() : null,
                p.getLanguage(), p.getPrice(), p.getOriginalPrice(), p.getStatus(), p.getReleaseDate(),
                p.getDepositPercent(), p.getPreorderLimit(), p.getPerUserLimit(), remainingSlots(p),
                p.getDescription(), p.getSpecs(), p.isFeatured(), p.isNewArrival(), p.isActive(),
                p.getViewCount(), p.getCreatedAt());
    }

    // ===================== Public =====================

    @Transactional
    public ProductDetailDto getPublicDetail(String slug) {
        Product p = products.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy sản phẩm"));
        products.incrementView(p.getId());
        return toDetail(p);
    }

    public List<ProductCardDto> related(String slug) {
        Product p = products.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy sản phẩm"));
        Filter f = new Filter(null, p.getBrand().getSlug(), null, null, null, null, null, null, null, null, null, "popular");
        return list(f, 11).stream().filter(c -> !c.id().equals(p.getId())).limit(10).toList();
    }

    public HomeDto home() {
        List<BannerDto> active = banners.findByActiveTrueOrderBySortOrderAsc().stream().map(BannerDto::of).toList();
        List<BannerDto> main = active.stream().filter(b -> "MAIN".equals(b.position())).toList();
        List<BannerDto> side = active.stream().filter(b -> "SIDE".equals(b.position())).toList();

        Filter base = Filter.empty();
        List<ProductCardDto> upcoming = list(new Filter(null, null, null, null, null, ProductStatus.PRE_ORDER,
                null, null, null, null, null, "release"), 12);
        List<ProductCardDto> newArrivals = list(new Filter(null, null, null, null, null, null,
                null, null, null, true, null, "newest"), 12);
        List<ProductCardDto> featured = list(new Filter(null, null, null, null, null, null,
                null, null, true, null, null, "popular"), 12);

        List<BrandSection> sections = new ArrayList<>();
        for (Brand b : brands.findByActiveTrueOrderBySortOrderAscNameAsc()) {
            List<ProductCardDto> items = list(new Filter(null, b.getSlug(), null, null, null, null,
                    null, null, null, null, null, base.sort()), 10);
            if (!items.isEmpty()) sections.add(new BrandSection(BrandDto.of(b), items));
        }
        return new HomeDto(main, side, upcoming, newArrivals, featured, sections);
    }

    public SuggestDto suggest(String q) {
        String n = TextUtil.normalize(q);
        if (n.isEmpty()) return new SuggestDto(List.of(), List.of(), 0);
        String c = TextUtil.compact(q);

        Map<Long, Long> counts = setProductCounts();
        List<SetDto> setMatches = sets.findAllOrdered().stream()
                .filter(s -> {
                    String hay = TextUtil.normalize(String.join(" ",
                            Objects.toString(s.getCode(), ""), s.getName(), Objects.toString(s.getAlias(), ""),
                            s.getBrand().getName()));
                    boolean allWords = Arrays.stream(n.split(" ")).allMatch(hay::contains);
                    return allWords || hay.replace(" ", "").contains(c);
                })
                .limit(4)
                .map(s -> SetDto.of(s, counts.getOrDefault(s.getId(), 0L)))
                .toList();

        PageResponse<ProductCardDto> page = search(new Filter(q, null, null, null, null, null, null, null,
                null, null, null, "popular"), 0, 6, false);
        return new SuggestDto(setMatches, page.items(), page.totalElements());
    }

    public Map<Long, Long> setProductCounts() {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : sets.countActiveProductsBySet()) {
            map.put((Long) row[0], ((Number) row[1]).longValue());
        }
        return map;
    }

    // ===================== Admin =====================

    public ProductDetailDto getById(Long id) {
        return toDetail(find(id));
    }

    private Product find(Long id) {
        return products.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy sản phẩm"));
    }

    @Transactional
    public ProductDetailDto create(ProductInput in) {
        Product p = new Product();
        apply(p, in);
        products.save(p);
        return toDetail(p);
    }

    @Transactional
    public ProductDetailDto update(Long id, ProductInput in) {
        Product p = find(id);
        apply(p, in);
        return toDetail(p);
    }

    @Transactional
    public void delete(Long id) {
        products.delete(find(id));
    }

    @Transactional
    public ProductDetailDto setActive(Long id, boolean active) {
        Product p = find(id);
        p.setActive(active);
        return toDetail(p);
    }

    private void apply(Product p, ProductInput in) {
        Brand brand = brands.findById(in.brandId()).orElseThrow(() -> ApiException.badRequest("Thương hiệu không tồn tại"));
        Category category = categories.findById(in.categoryId()).orElseThrow(() -> ApiException.badRequest("Loại sản phẩm không tồn tại"));
        CardSet set = null;
        if (in.setId() != null) {
            set = sets.findById(in.setId()).orElseThrow(() -> ApiException.badRequest("Set không tồn tại"));
            if (!set.getBrand().getId().equals(brand.getId())) {
                throw ApiException.badRequest("Set không thuộc thương hiệu đã chọn");
            }
        }
        if (in.status() == ProductStatus.PRE_ORDER && in.releaseDate() == null) {
            throw ApiException.badRequest("Sản phẩm đặt trước cần có ngày phát hành");
        }

        String slugBase = TextUtil.isBlank(in.slug()) ? in.name() : in.slug();
        String desired = TextUtil.slugify(slugBase);
        if (!desired.equals(p.getSlug())) {
            p.setSlug(TextUtil.uniqueSlug(slugBase, s -> p.getId() == null
                    ? products.existsBySlug(s) : products.existsBySlugAndIdNot(s, p.getId())));
        }

        p.setName(in.name().trim());
        p.setBrand(brand);
        p.setCategory(category);
        p.setCardSet(set);
        p.setLanguage(in.language().trim().toUpperCase(Locale.ROOT));
        p.setPrice(in.price());
        p.setOriginalPrice(in.originalPrice());
        p.setStatus(in.status());
        p.setReleaseDate(in.releaseDate());
        p.setDepositPercent(in.depositPercent());
        p.setPreorderLimit(in.preorderLimit());
        p.setPerUserLimit(in.perUserLimit());
        p.setDescription(TextUtil.trimToNull(in.description()));
        p.setSpecs(TextUtil.trimToNull(in.specs()));
        p.setFeatured(in.featured());
        p.setNewArrival(in.isNew());
        if (in.active() != null) p.setActive(in.active());

        List<String> urls = in.images() == null ? List.of()
                : in.images().stream().filter(u -> !TextUtil.isBlank(u)).map(String::trim).distinct().toList();
        if (urls.size() > MAX_IMAGES) throw ApiException.badRequest("Mỗi sản phẩm tối đa " + MAX_IMAGES + " ảnh");
        p.getImages().clear();
        int i = 0;
        for (String url : urls) p.getImages().add(new ProductImage(p, url, i++));
        p.setSearchText(buildSearchText(p));
    }

    // ===================== Search text =====================

    public static String buildSearchText(Product p) {
        StringBuilder sb = new StringBuilder();
        sb.append(p.getName()).append(' ')
                .append(p.getBrand().getName()).append(' ')
                .append(p.getCategory().getName()).append(' ')
                .append(p.getLanguage()).append(' ')
                .append(LANGUAGE_WORDS.getOrDefault(p.getLanguage(), ""));
        CardSet s = p.getCardSet();
        String codeCompact = "";
        if (s != null) {
            sb.append(' ').append(Objects.toString(s.getCode(), ""))
                    .append(' ').append(s.getName())
                    .append(' ').append(Objects.toString(s.getAlias(), ""));
            codeCompact = TextUtil.compact(s.getCode());
        }
        return (TextUtil.normalize(sb.toString()) + " " + codeCompact + " " + TextUtil.compact(p.getName())).trim();
    }

    @Transactional
    public int rebuildMissingSearchText() {
        List<Product> list = products.findBySearchTextIsNull();
        list.forEach(p -> p.setSearchText(buildSearchText(p)));
        return list.size();
    }

    @Transactional
    public void rebuildSearchText(Collection<Product> list) {
        list.forEach(p -> p.setSearchText(buildSearchText(p)));
    }
}
