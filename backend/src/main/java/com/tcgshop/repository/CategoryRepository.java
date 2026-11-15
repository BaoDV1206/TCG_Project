package com.tcgshop.repository;

import com.tcgshop.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByOrderBySortOrderAscNameAsc();

    boolean existsBySlug(String slug);
}
