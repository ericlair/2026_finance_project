package com.example.investment_portfolio.repository;

import com.example.investment_portfolio.entity.DividendHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DividendHistoryRepository extends JpaRepository<DividendHistory, Long> {

    /** 지급기준일 최신순 */
    List<DividendHistory> findByProductIdOrderByPayDateDesc(Long productId);
}