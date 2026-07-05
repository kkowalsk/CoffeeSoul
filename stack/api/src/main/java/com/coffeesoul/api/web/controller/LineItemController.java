package com.coffeesoul.api.web.controller;

import com.coffeesoul.api.web.dto.LineItemRequest;
import com.coffeesoul.api.web.dto.LineItemResponse;
import com.coffeesoul.api.web.service.LineItemService;
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
@RequestMapping("/line-items")
public class LineItemController {

    private final LineItemService service;

    public LineItemController(LineItemService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<LineItemResponse> create(@Valid @RequestBody LineItemRequest request) {
        LineItemResponse created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<LineItemResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LineItemResponse> get(@PathVariable UUID id) {
        return ResponseEntity.of(service.get(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LineItemResponse> update(
            @PathVariable UUID id, @Valid @RequestBody LineItemRequest request) {
        return ResponseEntity.of(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        return service.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
