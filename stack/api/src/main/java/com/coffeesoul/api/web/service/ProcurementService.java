package com.coffeesoul.api.web.service;

import com.coffeesoul.api.repository.ProcurementRepository;
import com.coffeesoul.api.web.dto.ProcurementRequest;
import com.coffeesoul.api.web.dto.ProcurementResponse;
import com.coffeesoul.api.web.dto.ProcurementTotalResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProcurementService {

    Logger log = LoggerFactory.getLogger(this.getClass());

    private final ProcurementRepository repository;

    public ProcurementService(ProcurementRepository repository) {
        this.repository = repository;
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
}
