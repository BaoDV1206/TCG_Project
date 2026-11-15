package com.tcgshop.repository;

import com.tcgshop.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    List<Brand> findAllByOrderBySortOrderAscNameAsc();

    List<Brand> findByActiveTrueOrderBySortOrderAscNameAsc();

    Optional<Brand> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
