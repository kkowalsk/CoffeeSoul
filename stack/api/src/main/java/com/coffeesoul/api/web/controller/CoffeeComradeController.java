package com.coffeesoul.api.web.controller;

import com.coffeesoul.api.web.dto.CoffeeComradeRequest;
import com.coffeesoul.api.web.dto.CoffeeComradeResponse;
import com.coffeesoul.api.web.service.CoffeeComradeService;
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
@RequestMapping("/coffee-comrades")
public class CoffeeComradeController {

    private final CoffeeComradeService service;

    public CoffeeComradeController(CoffeeComradeService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<CoffeeComradeResponse> create(@Valid @RequestBody CoffeeComradeRequest request) {
        CoffeeComradeResponse created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<CoffeeComradeResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CoffeeComradeResponse> get(@PathVariable UUID id) {
        return ResponseEntity.of(service.get(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CoffeeComradeResponse> update(
            @PathVariable UUID id, @Valid @RequestBody CoffeeComradeRequest request) {
        return ResponseEntity.of(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        return service.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
