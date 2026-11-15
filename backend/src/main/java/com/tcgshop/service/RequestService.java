package com.tcgshop.service;

import com.tcgshop.common.ApiException;
import com.tcgshop.common.PageResponse;
import com.tcgshop.common.TextUtil;
import com.tcgshop.dto.RequestDtos.*;
import com.tcgshop.entity.*;
import com.tcgshop.repository.ProductRepository;
import com.tcgshop.repository.ServiceRequestRepository;
import com.tcgshop.repository.UserRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class RequestService {
    private final ServiceRequestRepository requests;
    private final ProductRepository products;
    private final UserRepository users;

    public RequestService(ServiceRequestRepository requests, ProductRepository products, UserRepository users) {
        this.requests = requests;
        this.products = products;
        this.users = users;
    }

    // ===================== Mapping =====================

    public static String code(Long id) {
        return String.format("YC-%05d", id);
    }

    private RequestDto toDto(ServiceRequest r, boolean withHistory, boolean adminView) {
        Product p = r.getProduct();
        User u = r.getUser();
        String thumb = r.getProxyImageUrl();
        if (p != null && !p.getImages().isEmpty()) thumb = p.getImages().get(0).getUrl();
        List<HistoryDto> history = withHistory
                ? r.getHistory().stream().map(h -> new HistoryDto(h.getFromStatus(), h.getToStatus(), h.getNote(),
                adminView || h.getChangedBy() == null || h.getChangedBy().equals(u.getUsername()) ? h.getChangedBy() : "Shop",
                h.getCreatedAt())).toList()
                : List.of();
        List<RequestStatus> next = List.of();
        if (adminView && !r.getStatus().isTerminal()) {
            List<RequestStatus> n = new ArrayList<>(RequestStatus.adminNext(r.getType(), r.getStatus()));
            n.add(RequestStatus.REJECTED);
            next = n;
        }
        return new RequestDto(r.getId(), code(r.getId()), r.getType(), r.getStatus(),
                p != null ? p.getId() : null, p != null ? p.getSlug() : null,
                r.getProductName(), thumb, p != null ? p.getBrand().getName() : null,
                p != null ? p.getPrice() : null, p != null ? p.getDepositPercent() : null,
                p != null ? p.getReleaseDate() : null,
                r.getQuantity(), r.getNote(),
                r.getProxyUrl(), r.getProxyCountry(), r.getProxyRefPrice(), r.getProxyImageUrl(),
                r.getQuotedPrice(), r.getServiceFee(), r.getAdminNote(),
                r.isUserSeen(), r.getCreatedAt(), r.getUpdatedAt(),
                new UserMini(u.getId(), u.getUsername(), u.getFullName(), u.getPhone(), u.getEmail(), u.getAddress()),
                history, next);
    }

    /** Chuyển tham số status (có thể là nhóm hoặc trạng thái cụ thể) thành tập trạng thái */
    private static Set<RequestStatus> resolveStatuses(String status) {
        if (TextUtil.isBlank(status) || "ALL".equalsIgnoreCase(status)) return null;
        return switch (status.toUpperCase(Locale.ROOT)) {
            case "PROCESSING" -> RequestStatus.PROCESSING;
            case "CLOSED" -> RequestStatus.CLOSED;
            default -> {
                try {
                    yield EnumSet.of(RequestStatus.valueOf(status.toUpperCase(Locale.ROOT)));
                } catch (IllegalArgumentException e) {
                    throw ApiException.badRequest("Trạng thái không hợp lệ");
                }
            }
        };
    }

    // ===================== User =====================

    private User activeUser(Long uid) {
        User u = users.findById(uid).orElseThrow(() -> ApiException.unauthorized("Vui lòng đăng nhập lại"));
        if (!u.isEnabled()) throw ApiException.forbidden("Tài khoản của bạn đã bị khóa");
        return u;
    }

    @Transactional
    public RequestDto create(Long uid, CreateRequestInput in) {
        User u = activeUser(uid);
        if (in.type() == RequestType.PROXY) throw ApiException.badRequest("Vui lòng dùng form Đặt hộ");
        Product p = products.findForUpdate(in.productId())
                .filter(Product::isActive)
                .orElseThrow(() -> ApiException.notFound("Sản phẩm không tồn tại"));

        if (in.type() == RequestType.PRE_ORDER) {
            if (p.getStatus() != ProductStatus.PRE_ORDER) {
                throw ApiException.badRequest("Sản phẩm này hiện không nhận đặt trước");
            }
            if (p.getPerUserLimit() != null) {
                long mine = requests.sumUserQuantity(RequestType.PRE_ORDER, RequestStatus.CLOSED, p.getId(), uid);
                if (mine + in.quantity() > p.getPerUserLimit()) {
                    long left = Math.max(0, p.getPerUserLimit() - mine);
                    throw ApiException.badRequest(left == 0
                            ? "Bạn đã đặt tối đa " + p.getPerUserLimit() + " sản phẩm này"
                            : "Bạn chỉ có thể đặt thêm tối đa " + left + " sản phẩm");
                }
            }
            if (p.getPreorderLimit() != null) {
                long used = requests.sumQuantityByProduct(RequestType.PRE_ORDER, RequestStatus.CLOSED, List.of(p.getId()))
                        .stream().mapToLong(row -> ((Number) row[1]).longValue()).sum();
                long left = p.getPreorderLimit() - used;
                if (left <= 0) throw ApiException.badRequest("Sản phẩm đã hết suất đặt trước");
                if (in.quantity() > left) throw ApiException.badRequest("Chỉ còn " + left + " suất đặt trước");
            }
        } else if (p.getStatus() == ProductStatus.PRE_ORDER) {
            throw ApiException.badRequest("Sản phẩm sắp phát hành, vui lòng dùng chức năng Đặt trước");
        }

        ServiceRequest r = new ServiceRequest();
        r.setUser(u);
        r.setType(in.type());
        r.setProduct(p);
        r.setProductName(p.getName());
        r.setQuantity(in.quantity());
        String note = TextUtil.trimToNull(in.note());
        if (in.type() == RequestType.PURCHASE && p.getStatus() == ProductStatus.OUT_OF_STOCK) {
            note = "[Báo khi có hàng] " + (note == null ? "" : note);
        }
        r.setNote(note == null ? null : note.trim());
        r.addHistory(null, RequestStatus.PENDING, null, u.getUsername());
        requests.save(r);
        return toDto(r, true, false);
    }

    @Transactional
    public RequestDto createProxy(Long uid, ProxyRequestInput in) {
        User u = activeUser(uid);
        if (TextUtil.isBlank(in.productUrl()) && TextUtil.isBlank(in.productName())) {
            throw ApiException.badRequest("Vui lòng nhập link hoặc tên sản phẩm");
        }
        ServiceRequest r = new ServiceRequest();
        r.setUser(u);
        r.setType(RequestType.PROXY);
        r.setProductName(TextUtil.isBlank(in.productName()) ? in.productUrl().trim() : in.productName().trim());
        r.setProxyUrl(TextUtil.trimToNull(in.productUrl()));
        r.setProxyCountry(in.country());
        r.setProxyRefPrice(in.refPrice());
        r.setProxyImageUrl(TextUtil.trimToNull(in.imageUrl()));
        r.setQuantity(in.quantity());
        r.setNote(TextUtil.trimToNull(in.note()));
        r.addHistory(null, RequestStatus.PENDING, null, u.getUsername());
        requests.save(r);
        return toDto(r, true, false);
    }

    private Specification<ServiceRequest> spec(Long userId, String type, String status, String q,
                                               LocalDate from, LocalDate to) {
        Set<RequestStatus> statuses = resolveStatuses(status);
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (userId != null) ps.add(cb.equal(root.get("user").get("id"), userId));
            if (!TextUtil.isBlank(type) && !"ALL".equalsIgnoreCase(type)) {
                try {
                    ps.add(cb.equal(root.get("type"), RequestType.valueOf(type.toUpperCase(Locale.ROOT))));
                } catch (IllegalArgumentException e) {
                    throw ApiException.badRequest("Loại yêu cầu không hợp lệ");
                }
            }
            if (statuses != null) ps.add(root.get("status").in(statuses));
            if (from != null) ps.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            if (to != null) ps.add(cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay()));
            if (!TextUtil.isBlank(q)) {
                String like = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                Join<ServiceRequest, User> u = root.join("user", JoinType.INNER);
                List<Predicate> any = new ArrayList<>(List.of(
                        cb.like(cb.lower(u.get("fullName")), like),
                        cb.like(cb.lower(u.get("username")), like),
                        cb.like(cb.lower(cb.coalesce(u.get("phone"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("productName"), "")), like)));
                String digits = q.replaceAll("[^0-9]", "");
                if (!digits.isEmpty() && digits.length() <= 12) any.add(cb.equal(root.get("id"), Long.parseLong(digits)));
                ps.add(cb.or(any.toArray(new Predicate[0])));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
    }

    public PageResponse<RequestDto> listMine(Long uid, String type, String status, int page, int size) {
        Page<ServiceRequest> result = requests.findAll(spec(uid, type, status, null, null, null),
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50), Sort.by(Sort.Order.desc("updatedAt"))));
        return PageResponse.of(result, r -> toDto(r, false, false));
    }

    public RequestSummary summary(Long uid) {
        Map<RequestStatus, Long> counts = new EnumMap<>(RequestStatus.class);
        for (Object[] row : requests.countByStatusForUser(uid)) {
            counts.put((RequestStatus) row[0], ((Number) row[1]).longValue());
        }
        long all = counts.values().stream().mapToLong(Long::longValue).sum();
        long processing = RequestStatus.PROCESSING.stream().mapToLong(s -> counts.getOrDefault(s, 0L)).sum();
        long closed = RequestStatus.CLOSED.stream().mapToLong(s -> counts.getOrDefault(s, 0L)).sum();
        return new RequestSummary(all, counts.getOrDefault(RequestStatus.PENDING, 0L), processing,
                counts.getOrDefault(RequestStatus.COMPLETED, 0L), closed, requests.countByUserIdAndUserSeenFalse(uid));
    }

    private ServiceRequest findMine(Long uid, Long id) {
        ServiceRequest r = requests.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy yêu cầu"));
        if (!r.getUser().getId().equals(uid)) throw ApiException.notFound("Không tìm thấy yêu cầu");
        return r;
    }

    @Transactional
    public RequestDto getMine(Long uid, Long id) {
        ServiceRequest r = findMine(uid, id);
        r.setUserSeen(true);
        return toDto(r, true, false);
    }

    @Transactional
    public RequestDto cancel(Long uid, Long id, String reason) {
        ServiceRequest r = findMine(uid, id);
        if (r.getStatus() != RequestStatus.PENDING) {
            throw ApiException.badRequest("Chỉ có thể hủy yêu cầu đang chờ duyệt");
        }
        r.addHistory(r.getStatus(), RequestStatus.CANCELLED, TextUtil.trimToNull(reason), r.getUser().getUsername());
        r.setStatus(RequestStatus.CANCELLED);
        return toDto(r, true, false);
    }

    @Transactional
    public RequestDto respondQuote(Long uid, Long id, QuoteResponseInput in) {
        ServiceRequest r = findMine(uid, id);
        if (r.getType() != RequestType.PROXY || r.getStatus() != RequestStatus.QUOTED) {
            throw ApiException.badRequest("Yêu cầu không ở trạng thái chờ xác nhận báo giá");
        }
        RequestStatus next = in.accept() ? RequestStatus.CONFIRMED : RequestStatus.CANCELLED;
        String note = TextUtil.trimToNull(in.note());
        if (note == null) note = in.accept() ? "Khách đồng ý báo giá" : "Khách từ chối báo giá";
        r.addHistory(r.getStatus(), next, note, r.getUser().getUsername());
        r.setStatus(next);
        return toDto(r, true, false);
    }

    // ===================== Admin =====================

    public PageResponse<RequestDto> adminList(String type, String status, String q, LocalDate from, LocalDate to,
                                              Long userId, int page, int size) {
        Page<ServiceRequest> result = requests.findAll(spec(userId, type, status, q, from, to),
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Order.desc("createdAt"))));
        return PageResponse.of(result, r -> toDto(r, false, true));
    }

    public RequestDto adminGet(Long id) {
        return toDto(requests.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy yêu cầu")), true, true);
    }

    @Transactional
    public RequestDto transition(String adminUsername, Long id, TransitionInput in) {
        ServiceRequest r = requests.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy yêu cầu"));
        RequestStatus target = in.status();
        String note = TextUtil.trimToNull(in.note());
        if (r.getStatus().isTerminal()) throw ApiException.badRequest("Yêu cầu đã kết thúc, không thể thay đổi");

        if (target == RequestStatus.REJECTED) {
            if (note == null) throw ApiException.badRequest("Vui lòng nhập lý do từ chối");
        } else if (!RequestStatus.adminNext(r.getType(), r.getStatus()).contains(target)) {
            throw ApiException.badRequest("Không thể chuyển sang trạng thái này");
        }

        if (target == RequestStatus.QUOTED) {
            if (in.quotedPrice() == null || in.quotedPrice().signum() <= 0) {
                throw ApiException.badRequest("Vui lòng nhập giá báo cho khách");
            }
            r.setQuotedPrice(in.quotedPrice());
            r.setServiceFee(in.serviceFee() == null ? BigDecimal.ZERO : in.serviceFee());
        }
        if (note != null) r.setAdminNote(note);
        r.addHistory(r.getStatus(), target, note, adminUsername);
        r.setStatus(target);
        r.setUserSeen(false);
        return toDto(r, true, true);
    }

    public DashboardDto dashboard() {
        LocalDate today = LocalDate.now();
        long pending = requests.countByStatus(RequestStatus.PENDING);
        long todayCount = requests.countByCreatedAtGreaterThanEqual(today.atStartOfDay());

        Map<RequestType, Long> pendingByType = new EnumMap<>(RequestType.class);
        for (RequestType t : RequestType.values()) pendingByType.put(t, 0L);
        for (Object[] row : requests.countByTypeWithStatus(RequestStatus.PENDING)) {
            pendingByType.put((RequestType) row[0], ((Number) row[1]).longValue());
        }

        LocalDate start = today.minusDays(29);
        Map<LocalDate, long[]> byDay = new LinkedHashMap<>();
        for (int i = 0; i < 30; i++) byDay.put(start.plusDays(i), new long[3]);
        for (Object[] row : requests.findCreatedSince(start.atStartOfDay())) {
            long[] c = byDay.get(((LocalDateTime) row[0]).toLocalDate());
            if (c != null) c[((RequestType) row[1]).ordinal()]++;
        }
        List<DailyStat> daily = byDay.entrySet().stream()
                .map(e -> new DailyStat(e.getKey(), e.getValue()[0], e.getValue()[1], e.getValue()[2])).toList();

        List<RequestDto> latest = adminList(null, null, null, null, null, null, 0, 10).items();
        List<TopProduct> top = requests.topProducts(RequestType.PRE_ORDER, RequestStatus.CLOSED, PageRequest.of(0, 5))
                .stream().map(row -> new TopProduct((Long) row[0], (String) row[1], (String) row[2],
                        ((Number) row[3]).longValue())).toList();

        return new DashboardDto(pending, todayCount, products.countByActiveTrue(), users.count(),
                pendingByType, daily, latest, top);
    }
}
