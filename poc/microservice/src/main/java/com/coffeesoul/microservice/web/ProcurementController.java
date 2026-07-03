package com.coffeesoul.microservice.web;

import com.coffeesoul.microservice.repository.ProcurementRepository;
import com.coffeesoul.microservice.web.dto.ProcurementRequest;
import com.coffeesoul.microservice.web.dto.ProcurementResponse;
import com.coffeesoul.microservice.web.dto.ProcurementTotalResponse;
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

    private final ProcurementRepository repository;

    public ProcurementController(ProcurementRepository repository) {
        this.repository = repository;
    }

    // line items are added separately via POST /line-items referencing the id
    // returned here.
    @PostMapping
    public ResponseEntity<ProcurementResponse> create(@Valid @RequestBody ProcurementRequest request) {
        ProcurementResponse created = repository.create(request.timestamp(), request.payeeId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<ProcurementResponse> list() {
        return repository.findAll();
    }

    // calculated totals from v_procurement_total (sum of line-item brew prices).
    // Declared before /{id} so the literal "totals" segment isn't matched as an id.
    @GetMapping("/totals")
    public List<ProcurementTotalResponse> totals() {
        return repository.findAllTotals();
    }

    @GetMapping("/{id}/total")
    public ResponseEntity<ProcurementTotalResponse> total(@PathVariable UUID id) {
        return ResponseEntity.of(repository.findTotalById(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProcurementResponse> get(@PathVariable UUID id) {
        return ResponseEntity.of(repository.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProcurementResponse> update(
            @PathVariable UUID id, @Valid @RequestBody ProcurementRequest request) {
        return ResponseEntity.of(repository.update(id, request.timestamp(), request.payeeId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        return repository.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
