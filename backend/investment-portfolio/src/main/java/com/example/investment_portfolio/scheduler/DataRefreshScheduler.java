package com.example.investment_portfolio.scheduler;

import com.example.investment_portfolio.service.EtfDividendRateService;
import com.example.investment_portfolio.service.EtfPriceBatchService;
import com.example.investment_portfolio.service.StockDividendBatchService;
import com.example.investment_portfolio.service.StockPriceBatchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Function;
import java.util.function.Supplier;

/**
 * 실데이터 자동 갱신. app.scheduler.enabled=true 일 때만 만들어진다.
 *
 * [정기 실행] 평일 14:00(서울 시간)
 *   공공 API는 영업일 다음 날 오후 1시 이후에 그 영업일 종가를 올리므로 14:00으로 잡았다.
 *
 * [따라잡기] 서버를 켠 30초 뒤에 한 번, 이후 1시간마다
 *   DB의 가장 최근 종가일이 "지금 받을 수 있는 최신 영업일"보다 오래됐으면 갱신을 돌린다.
 *   최신이면 아무것도 하지 않는다. 서버를 안 켠 날이 있어도 켜면 알아서 맞춰진다.
 *   같은 따라잡기는 3시간 안에 반복하지 않는다 (공휴일 등 새 데이터가 없는 날 API를 계속 부르지 않게).
 *   공휴일은 모르는 단순 계산이라, 공휴일 직후에는 불필요한 갱신이 한 번 더 돌 수 있다(무해).
 *
 * [기록] 갱신이 끝날 때마다 data_refresh_log에 한 줄을 남긴다 (화면의 "마지막 갱신" 표시용).
 *   ok = 4단계가 모두 쓸 만하게 끝났고 문제 종목이 0건. 기록 저장이 실패해도 갱신 결과에는 영향 없다.
 *
 * 순서: 배당주 종가 → 배당주 배당률 → ETF 종가 → ETF 분배율
 *  - 각 서비스는 종목 하나가 실패해도 예외를 던지지 않고 Result.status에 적어서 돌려준다.
 *    그래서 "예외"가 아니라 status로 문제를 판단한다.
 *  - 한 단계가 통째로 실패하면(예외, 대상 0건, 전부 문제) 그 단계에 의존하는 다음 단계만 건너뛴다.
 *      배당주 종가 실패 → 배당주 배당률 건너뜀 (배당률 = 배당금 ÷ 저장된 종가)
 *      ETF 분배율은 분배금 이력(dividend_history)만 쓰므로 종가와 무관하게 실행
 *  - 이미 실행 중이면 새 실행은 건너뛴다 (겹침 방지).
 *  - ETF 분배금 이력 입력(SEIBro)과 /demo/etf-isin(ISIN 조회)은 자동화 대상이 아니다.
 */
@Component
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true")
public class DataRefreshScheduler {

    private static final Logger log = LoggerFactory.getLogger(DataRefreshScheduler.class);

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    /** 이 시각 이후면 전 영업일 종가까지 받을 수 있다고 본다 (API는 오후 1시 이후 갱신). */
    private static final LocalTime API_READY_TIME = LocalTime.of(14, 0);
    private static final Duration CATCH_UP_COOLDOWN = Duration.ofHours(3);

    /** 이 접두어로 시작하는 status는 정상(또는 정상적인 0%/부분 결과)으로 본다. */
    private static final List<String> OK_PREFIXES = List.of("OK", "ANNUALIZED", "PARTIAL", "ZERO");

    private final StockPriceBatchService stockPriceBatchService;
    private final StockDividendBatchService stockDividendBatchService;
    private final EtfPriceBatchService etfPriceBatchService;
    private final EtfDividendRateService etfDividendRateService;
    private final JdbcTemplate jdbcTemplate;

    private final AtomicBoolean running = new AtomicBoolean(false);
    private volatile LocalDateTime lastCatchUpAttempt;

    public DataRefreshScheduler(StockPriceBatchService stockPriceBatchService,
                                StockDividendBatchService stockDividendBatchService,
                                EtfPriceBatchService etfPriceBatchService,
                                EtfDividendRateService etfDividendRateService,
                                JdbcTemplate jdbcTemplate) {
        this.stockPriceBatchService = stockPriceBatchService;
        this.stockDividendBatchService = stockDividendBatchService;
        this.etfPriceBatchService = etfPriceBatchService;
        this.etfDividendRateService = etfDividendRateService;
        this.jdbcTemplate = jdbcTemplate;
    }

    /** 지금 갱신이 돌고 있는지 (GET /api/data-status 에서 사용) */
    public boolean isRunning() {
        return running.get();
    }

    /** 한 단계의 결과: usable = 쓸 만하게 끝남, problems = 문제 종목 수 */
    private record StepResult(boolean usable, int problems) {}

    /** 기본: 평일 14:00. app.scheduler.cron 으로 바꿀 수 있다 (초 분 시 일 월 요일). */
    @Scheduled(cron = "${app.scheduler.cron:0 0 14 * * MON-FRI}", zone = "Asia/Seoul")
    public void refreshAll() {
        if (!running.compareAndSet(false, true)) {
            log.warn("[스케줄러] 이전 갱신이 아직 실행 중이라 이번 실행은 건너뜁니다.");
            return;
        }
        long start = System.currentTimeMillis();
        LocalDateTime startedAt = LocalDateTime.now(SEOUL);
        boolean allUsable = true;
        int problems = 0;
        try {
            log.info("[스케줄러] 데이터 갱신 시작");

            StepResult stockPrice = runStep("1/4 배당주 종가",
                    stockPriceBatchService::refreshStocks,
                    StockPriceBatchService.Result::name,
                    StockPriceBatchService.Result::status);
            allUsable &= stockPrice.usable();
            problems += stockPrice.problems();

            if (stockPrice.usable()) {
                StepResult stockDividend = runStep("2/4 배당주 배당률",
                        stockDividendBatchService::refreshDividendRates,
                        StockDividendBatchService.Result::name,
                        StockDividendBatchService.Result::status);
                allUsable &= stockDividend.usable();
                problems += stockDividend.problems();
            } else {
                allUsable = false;
                log.error("[스케줄러] 2/4 배당주 배당률은 종가 갱신이 실패해 건너뜁니다.");
            }

            StepResult etfPrice = runStep("3/4 ETF 종가",
                    etfPriceBatchService::refreshEtfs,
                    EtfPriceBatchService.Result::name,
                    EtfPriceBatchService.Result::status);
            allUsable &= etfPrice.usable();
            problems += etfPrice.problems();

            // ETF 분배율은 종가를 쓰지 않으므로 3단계 결과와 관계없이 실행
            StepResult etfDividend = runStep("4/4 ETF 분배율",
                    etfDividendRateService::refreshEtfDividendRates,
                    EtfDividendRateService.Result::name,
                    EtfDividendRateService.Result::status);
            allUsable &= etfDividend.usable();
            problems += etfDividend.problems();

            log.info("[스케줄러] 데이터 갱신 끝 ({}초)", (System.currentTimeMillis() - start) / 1000);
            recordRun(startedAt, LocalDateTime.now(SEOUL), allUsable && problems == 0, problems);
        } catch (Exception e) {
            // 어떤 경우에도 다음 실행이 막히지 않게 한다
            log.error("[스케줄러] 데이터 갱신 중 예상하지 못한 오류", e);
            recordRun(startedAt, LocalDateTime.now(SEOUL), false, problems);
        } finally {
            running.set(false);
        }
    }

    /** 서버를 켠 30초 뒤 한 번, 이후 1시간마다: 데이터가 최신이 아니면 갱신을 돌린다. */
    @Scheduled(initialDelay = 30_000, fixedDelay = 3_600_000)
    public void catchUpIfStale() {
        try {
            LocalDateTime now = LocalDateTime.now(SEOUL);
            LocalDateTime last = lastCatchUpAttempt;
            if (last != null && Duration.between(last, now).compareTo(CATCH_UP_COOLDOWN) < 0) {
                return;
            }

            LocalDate latest = jdbcTemplate.queryForObject("SELECT MAX(bas_dt) FROM price_history", LocalDate.class);
            LocalDate expected = expectedLatestDate(now);
            boolean stale = latest == null || latest.isBefore(expected);

            log.info("[스케줄러] 따라잡기 확인: DB 최신 종가일 {}, 받을 수 있는 최신일 {} → {}",
                    latest, expected, stale ? "갱신 필요" : "최신 상태");
            if (!stale) {
                return;
            }
            lastCatchUpAttempt = now;
            refreshAll();
        } catch (Exception e) {
            log.warn("[스케줄러] 따라잡기 확인 중 오류 (다음 주기에 다시 시도): {}", e.getMessage());
        }
    }

    /**
     * 지금 시각에 공공 API에서 받을 수 있는 가장 최근 영업일(월~금, 공휴일은 모름).
     * 영업일 D의 종가는 그다음 영업일 오후 1시 이후에 올라온다.
     *  - 평일 14:00 이후: 직전 영업일
     *  - 평일 14:00 이전, 주말: 직전 영업일의 전 영업일
     */
    private LocalDate expectedLatestDate(LocalDateTime now) {
        LocalDate day = now.toLocalDate();
        boolean weekday = day.getDayOfWeek().getValue() <= 5;
        int back = (weekday && !now.toLocalTime().isBefore(API_READY_TIME)) ? 1 : 2;
        while (back > 0) {
            day = day.minusDays(1);
            if (day.getDayOfWeek().getValue() <= 5) {
                back--;
            }
        }
        return day;
    }

    /** 갱신 결과를 data_refresh_log에 한 줄 남긴다. 실패해도 갱신 자체에는 영향 없다. */
    private void recordRun(LocalDateTime startedAt, LocalDateTime finishedAt, boolean ok, int problems) {
        try {
            jdbcTemplate.update(
                    "INSERT INTO data_refresh_log (started_at, finished_at, ok, problem_count) VALUES (?, ?, ?, ?)",
                    startedAt, finishedAt, ok, problems);
        } catch (Exception e) {
            log.warn("[스케줄러] 갱신 기록 저장 실패 (갱신 결과에는 영향 없음): {}", e.getMessage());
        }
    }

    /**
     * 한 단계를 실행하고 결과를 로그로 남긴다.
     * usable: 예외 없음, 대상 1건 이상, 전부 문제는 아님
     */
    private <R> StepResult runStep(String label, Supplier<List<R>> call,
                                   Function<R, String> nameOf, Function<R, String> statusOf) {
        long t = System.currentTimeMillis();
        List<R> results;
        try {
            results = call.get();
        } catch (Exception e) {
            log.error("[스케줄러] {} 실패 (예외): {}", label, e.getMessage(), e);
            return new StepResult(false, 0);
        }

        int total = results.size();
        int problems = 0;
        for (R r : results) {
            String status = statusOf.apply(r);
            if (isProblem(status)) {
                problems++;
                log.warn("[스케줄러] {} - {} : {}", label, nameOf.apply(r), status);
            }
        }
        log.info("[스케줄러] {} 완료: 전체 {}건, 문제 {}건 ({}초)",
                label, total, problems, (System.currentTimeMillis() - t) / 1000);

        if (total == 0) {
            log.error("[스케줄러] {} : 대상 종목이 0건입니다.", label);
            return new StepResult(false, 0);
        }
        if (problems == total) {
            log.error("[스케줄러] {} : 전 종목에 문제가 있어 실패로 봅니다.", label);
            return new StepResult(false, problems);
        }
        return new StepResult(true, problems);
    }

    private boolean isProblem(String status) {
        if (status == null) {
            return true;
        }
        for (String prefix : OK_PREFIXES) {
            if (status.startsWith(prefix)) {
                return false;
            }
        }
        return true;
    }
}