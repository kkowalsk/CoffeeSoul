package com.coffeesoul.api.web.controller;

import com.coffeesoul.api.web.dto.ProcurementRequest;
import com.coffeesoul.api.web.dto.ProcurementResponse;
import com.coffeesoul.api.web.dto.ProcurementTotalResponse;
import com.coffeesoul.api.web.service.ProcurementService;
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
@RequestMapping("/procurements")
public class ProcurementController {

    private final ProcurementService service;

    public ProcurementController(ProcurementService service) {
        this.service = service;
    }

    // line items are added separately via POST /line-items referencing the id
    // returned here.
    @PostMapping
    public ResponseEntity<ProcurementResponse> create(@Valid @RequestBody ProcurementRequest request) {
        ProcurementResponse created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<ProcurementResponse> list() {
        return service.list();
    }

    // calculated totals from v_procurement_total (sum of line-item brew prices).
    // Declared before /{id} so the literal "totals" segment isn't matched as an id.
    @GetMapping("/totals")
    public List<ProcurementTotalResponse> totals() {
        return service.totals();
    }

    @GetMapping("/{id}/total")
    public ResponseEntity<ProcurementTotalResponse> total(@PathVariable UUID id) {
        return ResponseEntity.of(service.total(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProcurementResponse> get(@PathVariable UUID id) {
        return ResponseEntity.of(service.get(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProcurementResponse> update(
            @PathVariable UUID id, @Valid @RequestBody ProcurementRequest request) {
        return ResponseEntity.of(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        return service.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    // runs the weighted round robin and sets the payee; see
    // stack/weighted_round_robin.puml.
    @PostMapping("/{id}/finalize")
    public ProcurementResponse finalize(@PathVariable UUID id) {
        return service.finalize(id);
    }
}
