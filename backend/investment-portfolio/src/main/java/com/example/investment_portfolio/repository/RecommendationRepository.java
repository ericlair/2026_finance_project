package com.example.investment_portfolio.repository;

import com.example.investment_portfolio.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    List<Recommendation> findBySelectionId(Long selectionId);

    /** 목록 화면용: 저장 항목별 종목 수를 한 번에 조회 (항목마다 따로 세지 않기 위해) */
    interface SelectionCount {
        Long getSelectionId();
        long getCnt();
    }

    @Query("select r.selectionId as selectionId, count(r) as cnt "
            + "from Recommendation r where r.selectionId in :ids group by r.selectionId")
    List<SelectionCount> countBySelectionIds(@Param("ids") Collection<Long> ids);
}