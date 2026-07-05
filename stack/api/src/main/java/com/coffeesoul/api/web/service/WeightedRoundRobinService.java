package com.coffeesoul.api.web.service;

import com.coffeesoul.api.repository.LineItemRepository;
import com.coffeesoul.api.repository.LineItemRepository.ComradeAmount;
import com.coffeesoul.api.repository.ProcurementRepository;
import com.coffeesoul.api.repository.SmoothWeightedRoundRobinRepository;
import com.coffeesoul.api.web.dto.ProcurementResponse;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

// Java port of the SmoothWeightedRoundRobin logic in poc/source/poc.py,
// wired up per stack/weighted_round_robin.puml: a comrade's weight goes up by
// what they order and the highest-weight comrade pays, with that payment
// bringing their weight back down. State (comradeWeights/Totals/Payments)
// is in-memory only, so on startup it is rebuilt by replaying every
// already-finalized procurement in timestamp order.
@Service
public class WeightedRoundRobinService {

    private final Logger log = LoggerFactory.getLogger(getClass());

    private final SmoothWeightedRoundRobinRepository roundRobinRepository;
    private final ProcurementRepository procurementRepository;
    private final LineItemRepository lineItemRepository;

    // LinkedHashMap so a tie between two comrades' weights always resolves to
    // whichever of them first ever appeared on an order -- matches the poc's
    // dict-insertion-order tie-break.
    private final Map<UUID, BigDecimal> comradeWeights = new LinkedHashMap<>();
    private final Map<UUID, BigDecimal> comradeTotals = new LinkedHashMap<>();
    private final Map<UUID, Integer> comradePayments = new LinkedHashMap<>();

    private UUID roundRobinId;

    public WeightedRoundRobinService(
            SmoothWeightedRoundRobinRepository roundRobinRepository,
            ProcurementRepository procurementRepository,
            LineItemRepository lineItemRepository) {
        this.roundRobinRepository = roundRobinRepository;
        this.procurementRepository = procurementRepository;
        this.lineItemRepository = lineItemRepository;
    }

    @PostConstruct
    void init() {
        roundRobinId = roundRobinRepository.findFirstId().orElseGet(roundRobinRepository::create);
        log.info("round robin id: {}", roundRobinId);
        rebuildFromHistory();
    }

    private void rebuildFromHistory() {
        List<ProcurementResponse> finalized = procurementRepository.findAllFinalized();
        Map<UUID, List<ComradeAmount>> amountsByProcurement =
                lineItemRepository.findAmountsByComradeGroupedByProcurement().stream()
                        .collect(Collectors.groupingBy(ComradeAmount::procurementId));

        for (ProcurementResponse procurement : finalized) {
            Map<UUID, BigDecimal> amounts = amountsByProcurement
                    .getOrDefault(procurement.id(), List.of()).stream()
                    .collect(Collectors.toMap(
                            ComradeAmount::comradeId, ComradeAmount::amount, (a, b) -> a, LinkedHashMap::new));
            replay(amounts, procurement.payeeId());
        }
        log.info("replayed {} finalized procurements", finalized.size());
    }

    // Replays a historical order using its KNOWN payee, trusting recorded
    // history over recomputing (a payee may have been corrected manually via
    // PUT /procurements/{id}).
    private void replay(Map<UUID, BigDecimal> amountsByComrade, UUID payeeId) {
        BigDecimal total = accumulate(amountsByComrade);
        comradeWeights.merge(payeeId, total.negate(), BigDecimal::add);
        comradePayments.merge(payeeId, 1, Integer::sum);
    }

    // Live path: accumulates this order's per-comrade amounts, then decides
    // and applies who pays. Synchronized because comradeWeights/Totals/
    // Payments are mutated by every concurrent finalize call.
    public synchronized UUID finalizeOrder(Map<UUID, BigDecimal> amountsByComrade) {
        if (amountsByComrade.isEmpty()) {
            throw new IllegalArgumentException("cannot finalize an order with no line items");
        }
        BigDecimal total = accumulate(amountsByComrade);

        UUID payee = null;
        for (UUID comradeId : comradeWeights.keySet()) {
            if (payee == null || comradeWeights.get(comradeId).compareTo(comradeWeights.get(payee)) > 0) {
                payee = comradeId;
            }
        }
        comradeWeights.merge(payee, total.negate(), BigDecimal::add);
        comradePayments.merge(payee, 1, Integer::sum);
        log.info("finalize: total={}, payee={}", total, payee);
        return payee;
    }

    private BigDecimal accumulate(Map<UUID, BigDecimal> amountsByComrade) {
        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<UUID, BigDecimal> entry : amountsByComrade.entrySet()) {
            comradeWeights.merge(entry.getKey(), entry.getValue(), BigDecimal::add);
            comradeTotals.merge(entry.getKey(), entry.getValue(), BigDecimal::add);
            total = total.add(entry.getValue());
        }
        return total;
    }

    public UUID getRoundRobinId() {
        return roundRobinId;
    }
}
