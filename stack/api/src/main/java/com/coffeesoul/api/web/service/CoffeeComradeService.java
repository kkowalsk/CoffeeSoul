package com.coffeesoul.api.web.service;

import com.coffeesoul.api.repository.CoffeeComradeRepository;
import com.coffeesoul.api.web.dto.CoffeeComradeRequest;
import com.coffeesoul.api.web.dto.CoffeeComradeResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CoffeeComradeService {

    Logger log = LoggerFactory.getLogger(this.getClass());

    private final CoffeeComradeRepository repository;

    public CoffeeComradeService(CoffeeComradeRepository repository) {
        this.repository = repository;
    }

    public CoffeeComradeResponse create(CoffeeComradeRequest request) {
        log.info("create request: {}", request);
        return repository.create(request.name(), request.defaultBrewId());
    }

    public List<CoffeeComradeResponse> list() {
        log.info("list request");
        return repository.findAll();
    }

    public Optional<CoffeeComradeResponse> get(UUID id) {
        log.info("get request: id={}", id);
        return repository.findById(id);
    }

    public Optional<CoffeeComradeResponse> update(UUID id, CoffeeComradeRequest request) {
        log.info("update request: id={}, request={}", id, request);
        return repository.update(id, request.name(), request.defaultBrewId());
    }

    public boolean delete(UUID id) {
        log.info("delete request: id={}", id);
        return repository.delete(id);
    }
}
