package com.tcgshop.repository;

import com.tcgshop.entity.CardSet;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CardSetRepository extends JpaRepository<CardSet, Long> {
    @EntityGraph(attributePaths = "brand")
    @Query("select s from CardSet s order by s.releaseDate desc nulls last, s.name asc")
    List<CardSet> findAllOrdered();

    @EntityGraph(attributePaths = "brand")
    Optional<CardSet> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @Query("select p.cardSet.id, count(p) from Product p where p.active = true and p.cardSet is not null group by p.cardSet.id")
    List<Object[]> countActiveProductsBySet();
}
