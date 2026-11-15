package com.tcgshop.repository;

import com.tcgshop.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Optional<Product> findBySlugAndActiveTrue(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    List<Product> findByCardSetId(Long setId);

    List<Product> findByBrandId(Long brandId);

    List<Product> findBySearchTextIsNull();

    long countByActiveTrue();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findForUpdate(Long id);

    @Modifying
    @Query("update Product p set p.viewCount = p.viewCount + 1 where p.id = :id")
    void incrementView(Long id);
}
