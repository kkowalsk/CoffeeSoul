package com.coffeesoul.api.web.service;

import com.coffeesoul.api.repository.LineItemRepository;
import com.coffeesoul.api.web.dto.LineItemRequest;
import com.coffeesoul.api.web.dto.LineItemResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class LineItemService {

    Logger log = LoggerFactory.getLogger(this.getClass());

    private final LineItemRepository repository;

    public LineItemService(LineItemRepository repository) {
        this.repository = repository;
    }

    public LineItemResponse create(LineItemRequest request) {
        log.info("create request: {}", request);
        return repository.create(request.procurementId(), request.comradeId(), request.brewId());
    }

    public List<LineItemResponse> list() {
        log.info("list request");
        return repository.findAll();
    }

    public Optional<LineItemResponse> get(UUID id) {
        log.info("get request: id={}", id);
        return repository.findById(id);
    }

    public Optional<LineItemResponse> update(UUID id, LineItemRequest request) {
        log.info("update request: id={}, request={}", id, request);
        return repository.update(id, request.procurementId(), request.comradeId(), request.brewId());
    }

    public boolean delete(UUID id) {
        log.info("delete request: id={}", id);
        return repository.delete(id);
    }
}
