package com.example.investment_portfolio.repository;

import com.example.investment_portfolio.entity.PriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {

    boolean existsByProductIdAndBasDt(Long productId, LocalDate basDt);

    /** 최신 날짜부터 내림차순 */
    List<PriceHistory> findByProductIdOrderByBasDtDesc(Long productId);
}