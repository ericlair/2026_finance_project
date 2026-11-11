package com.example.investment_portfolio.api;

import com.example.investment_portfolio.scheduler.DataRefreshScheduler;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 화면의 "시세 기준일 · 마지막 갱신" 표시용. 읽기 전용이라 로그인 없이 열어도 되는 정보만 내려준다.
 * (SecurityConfig의 permitAll에 /api/data-status 를 추가해야 로그인 없이 볼 수 있다)
 */
@RestController
public class DataStatusController {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectProvider<DataRefreshScheduler> schedulerProvider;

    public DataStatusController(JdbcTemplate jdbcTemplate, ObjectProvider<DataRefreshScheduler> schedulerProvider) {
        this.jdbcTemplate = jdbcTemplate;
        this.schedulerProvider = schedulerProvider;
    }

    /**
     * latestPriceDate  : DB에 들어 있는 가장 최근 종가 날짜 (= 시세 기준일)
     * lastRefreshedAt  : 문제 없이 끝난 마지막 갱신의 종료 시각 (없으면 null)
     * lastAttemptAt    : 결과와 관계없이 마지막으로 갱신이 끝난 시각 (없으면 null)
     * refreshing       : 지금 갱신이 돌고 있는지 (스케줄러가 꺼져 있으면 항상 false)
     */
    public record DataStatusResponse(LocalDate latestPriceDate, LocalDateTime lastRefreshedAt,
                                     LocalDateTime lastAttemptAt, boolean refreshing) {}

    @GetMapping("/api/data-status")
    public DataStatusResponse status() {
        LocalDate latestPriceDate = jdbcTemplate.queryForObject(
                "SELECT MAX(bas_dt) FROM price_history", LocalDate.class);
        LocalDateTime lastRefreshedAt = jdbcTemplate.queryForObject(
                "SELECT MAX(finished_at) FROM data_refresh_log WHERE ok = 1", LocalDateTime.class);
        LocalDateTime lastAttemptAt = jdbcTemplate.queryForObject(
                "SELECT MAX(finished_at) FROM data_refresh_log", LocalDateTime.class);

        DataRefreshScheduler scheduler = schedulerProvider.getIfAvailable();
        boolean refreshing = scheduler != null && scheduler.isRunning();

        return new DataStatusResponse(latestPriceDate, lastRefreshedAt, lastAttemptAt, refreshing);
    }
}