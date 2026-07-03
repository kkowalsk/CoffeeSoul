package com.coffeesoul.microservice.web;

import com.coffeesoul.microservice.repository.CoffeeComradeRepository;
import com.coffeesoul.microservice.web.dto.CoffeeComradeRequest;
import com.coffeesoul.microservice.web.dto.CoffeeComradeResponse;
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

    private final CoffeeComradeRepository repository;

    public CoffeeComradeController(CoffeeComradeRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    public ResponseEntity<CoffeeComradeResponse> create(@Valid @RequestBody CoffeeComradeRequest request) {
        CoffeeComradeResponse created = repository.create(request.name(), request.defaultBrewId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<CoffeeComradeResponse> list() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CoffeeComradeResponse> get(@PathVariable UUID id) {
        return ResponseEntity.of(repository.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CoffeeComradeResponse> update(
            @PathVariable UUID id, @Valid @RequestBody CoffeeComradeRequest request) {
        return ResponseEntity.of(repository.update(id, request.name(), request.defaultBrewId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        return repository.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
