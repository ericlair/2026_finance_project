package com.example.investment_portfolio.scheduler;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 스케줄링 기능 켜기. app.scheduler.enabled=true 일 때만 동작한다 (기본값: 꺼짐).
 * 메인 클래스(InvestmentPortfolioApplication)를 건드리지 않으려고 여기에 둔다.
 */
@Configuration
@EnableScheduling
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true")
public class SchedulingConfig {
}