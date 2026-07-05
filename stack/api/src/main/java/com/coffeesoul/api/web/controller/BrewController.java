package com.coffeesoul.api.web.controller;

import com.coffeesoul.api.domain.Brew;
import com.coffeesoul.api.web.dto.BrewRequest;
import com.coffeesoul.api.web.service.BrewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/brews")
public class BrewController {

    private final BrewService service;

    public BrewController(BrewService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Brew> create(@Valid @RequestBody BrewRequest request) {
        Brew created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<Brew> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Brew> get(@PathVariable UUID id) {
        return ResponseEntity.of(service.get(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Brew> update(@PathVariable UUID id, @Valid @RequestBody BrewRequest request) {
        return ResponseEntity.of(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        return service.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
