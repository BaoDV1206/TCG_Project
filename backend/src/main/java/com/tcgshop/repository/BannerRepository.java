package com.tcgshop.repository;

import com.tcgshop.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BannerRepository extends JpaRepository<Banner, Long> {
    List<Banner> findAllByOrderByPositionAscSortOrderAsc();

    List<Banner> findByActiveTrueOrderBySortOrderAsc();
}
