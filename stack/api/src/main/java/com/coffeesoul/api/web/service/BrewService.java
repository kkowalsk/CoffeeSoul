package com.coffeesoul.api.web.service;

import com.coffeesoul.api.domain.Brew;
import com.coffeesoul.api.repository.BrewRepository;
import com.coffeesoul.api.web.dto.BrewRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BrewService {

    Logger log = LoggerFactory.getLogger(this.getClass());

    private final BrewRepository repository;

    public BrewService(BrewRepository repository) {
        this.repository = repository;
    }

    public Brew create(BrewRequest request) {
        log.info("create request: {}", request);
        return repository.create(request.name(), request.price(), request.description());
    }

    public List<Brew> list() {
        log.info("list request");
        return repository.findAll();
    }

    public Optional<Brew> get(UUID id) {
        log.info("get request: id={}", id);
        return repository.findById(id);
    }

    public Optional<Brew> update(UUID id, BrewRequest request) {
        log.info("update request: id={}, request={}", id, request);
        return repository.update(id, request.name(), request.price(), request.description());
    }

    public boolean delete(UUID id) {
        log.info("delete request: id={}", id);
        return repository.delete(id);
    }
}
