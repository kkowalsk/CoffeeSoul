package com.coffeesoul.api.web.service;

import com.coffeesoul.api.repository.LineItemRepository;
import com.coffeesoul.api.repository.LineItemRepository.ComradeAmount;
import com.coffeesoul.api.repository.ProcurementRepository;
import com.coffeesoul.api.web.dto.ProcurementRequest;
import com.coffeesoul.api.web.dto.ProcurementResponse;
import com.coffeesoul.api.web.dto.ProcurementTotalResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProcurementService {

    Logger log = LoggerFactory.getLogger(this.getClass());

    private final ProcurementRepository repository;
    private final LineItemRepository lineItemRepository;
    private final WeightedRoundRobinService roundRobinService;

    public ProcurementService(
            ProcurementRepository repository,
            LineItemRepository lineItemRepository,
            WeightedRoundRobinService roundRobinService) {
        this.repository = repository;
        this.lineItemRepository = lineItemRepository;
        this.roundRobinService = roundRobinService;
    }

    public ProcurementResponse create(ProcurementRequest request) {
        log.info("create request: {}", request);
        return repository.create(request.timestamp(), request.payeeId());
    }

    public List<ProcurementResponse> list() {
        log.info("list request");
        return repository.findAll();
    }

    public List<ProcurementTotalResponse> totals() {
        log.info("totals request");
        return repository.findAllTotals();
    }

    public Optional<ProcurementTotalResponse> total(UUID id) {
        log.info("total request: id={}", id);
        return repository.findTotalById(id);
    }

    public Optional<ProcurementResponse> get(UUID id) {
        log.info("get request: id={}", id);
        return repository.findById(id);
    }

    public Optional<ProcurementResponse> update(UUID id, ProcurementRequest request) {
        log.info("update request: id={}, request={}", id, request);
        return repository.update(id, request.timestamp(), request.payeeId());
    }

    public boolean delete(UUID id) {
        log.info("delete request: id={}", id);
        return repository.delete(id);
    }

    // "Reset History": wipes every procurement (and, via cascade, every line
    // item) and restarts the weighted round robin's in-memory weights --
    // brews and coffee comrades are untouched, they live in separate tables.
    public void resetHistory() {
        log.info("reset history request");
        repository.deleteAll();
        roundRobinService.reset();
    }

    // Runs this procurement's line items through the weighted round robin to
    // pick a payee, then persists that payee alongside the round robin's id.
    // See stack/weighted_round_robin.puml ("Finalize Order").
    public ProcurementResponse finalize(UUID id) {
        log.info("finalize request: id={}", id);
        ProcurementResponse procurement = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "procurement not found"));
        if (procurement.payeeId() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "procurement already finalized");
        }

        Map<UUID, BigDecimal> amountsByComrade = lineItemRepository.findAmountsByComradeForProcurement(id).stream()
                .collect(Collectors.toMap(
                        ComradeAmount::comradeId, ComradeAmount::amount, (a, b) -> a, LinkedHashMap::new));
        if (amountsByComrade.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY, "cannot finalize an order with no line items");
        }

        UUID payeeId = roundRobinService.finalizeOrder(amountsByComrade);
        ProcurementResponse finalized = repository.finalize(id, payeeId, roundRobinService.getRoundRobinId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "procurement not found"));

        // total isn't a stored column (see v_procurement_total) -- reuse the
        // amounts already gathered above rather than an extra query.
        BigDecimal total = amountsByComrade.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return finalized.withTotal(total);
    }
}
