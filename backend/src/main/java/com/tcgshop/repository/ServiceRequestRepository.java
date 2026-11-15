package com.tcgshop.repository;

import com.tcgshop.entity.RequestStatus;
import com.tcgshop.entity.RequestType;
import com.tcgshop.entity.ServiceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long>, JpaSpecificationExecutor<ServiceRequest> {

    @Override
    @EntityGraph(attributePaths = {"user", "product"})
    Page<ServiceRequest> findAll(Specification<ServiceRequest> spec, Pageable pageable);

    @Query("select r.product.id, sum(r.quantity) from ServiceRequest r " +
           "where r.type = :type and r.status not in :excluded and r.product.id in :ids group by r.product.id")
    List<Object[]> sumQuantityByProduct(RequestType type, Collection<RequestStatus> excluded, Collection<Long> ids);

    @Query("select coalesce(sum(r.quantity), 0) from ServiceRequest r " +
           "where r.type = :type and r.status not in :excluded and r.product.id = :productId and r.user.id = :userId")
    Long sumUserQuantity(RequestType type, Collection<RequestStatus> excluded, Long productId, Long userId);

    @Query("select r.status, count(r) from ServiceRequest r where r.user.id = :userId group by r.status")
    List<Object[]> countByStatusForUser(Long userId);

    long countByUserIdAndUserSeenFalse(Long userId);

    long countByUserId(Long userId);

    long countByStatus(RequestStatus status);

    long countByCreatedAtGreaterThanEqual(LocalDateTime from);

    @Query("select r.type, count(r) from ServiceRequest r where r.status = :status group by r.type")
    List<Object[]> countByTypeWithStatus(RequestStatus status);

    @Query("select r.createdAt, r.type from ServiceRequest r where r.createdAt >= :from")
    List<Object[]> findCreatedSince(LocalDateTime from);

    @Query("select r.product.id, r.product.name, r.product.slug, sum(r.quantity) from ServiceRequest r " +
           "where r.type = :type and r.status not in :excluded and r.product is not null " +
           "group by r.product.id, r.product.name, r.product.slug order by sum(r.quantity) desc")
    List<Object[]> topProducts(RequestType type, Collection<RequestStatus> excluded, Pageable pageable);

    @Query("select r.user.id, count(r) from ServiceRequest r where r.user.id in :userIds group by r.user.id")
    List<Object[]> countByUsers(Collection<Long> userIds);
}
