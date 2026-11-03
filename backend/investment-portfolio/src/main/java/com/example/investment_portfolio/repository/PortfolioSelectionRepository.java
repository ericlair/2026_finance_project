package com.example.investment_portfolio.repository;

import com.example.investment_portfolio.entity.PortfolioSelection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PortfolioSelectionRepository extends JpaRepository<PortfolioSelection, Long> {

    /** 내 저장 목록, 최신순 (같은 시각이면 id가 큰 쪽 먼저) */
    List<PortfolioSelection> findByUserIdOrderByCreatedAtDescIdDesc(Long userId);

    /** 내 것만 조회/삭제하기 위한 소유자 확인용. 남의 id면 비어 있음 → 404 처리 */
    Optional<PortfolioSelection> findByIdAndUserId(Long id, Long userId);
}