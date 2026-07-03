package com.coffeesoul.microservice.web;

import com.coffeesoul.microservice.domain.Brew;
import com.coffeesoul.microservice.repository.BrewRepository;
import com.coffeesoul.microservice.web.dto.BrewRequest;
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

    private final BrewRepository repository;

    public BrewController(BrewRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    public ResponseEntity<Brew> create(@Valid @RequestBody BrewRequest request) {
        Brew created = repository.create(request.name(), request.price(), request.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<Brew> list() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Brew> get(@PathVariable UUID id) {
        return ResponseEntity.of(repository.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Brew> update(@PathVariable UUID id, @Valid @RequestBody BrewRequest request) {
        return ResponseEntity.of(
                repository.update(id, request.name(), request.price(), request.description()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        return repository.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
