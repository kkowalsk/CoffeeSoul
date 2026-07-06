package com.coffeesoul.api.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

// total is optional and only ever populated by ProcurementService.finalize()
// -- every other endpoint (create/list/get/update) leaves it null.
public record ProcurementResponse(
        UUID id,
        Instant timestamp,
        UUID payeeId,
        UUID roundRobinId,
        BigDecimal total) {

    public ProcurementResponse withTotal(BigDecimal total) {
        return new ProcurementResponse(id, timestamp, payeeId, roundRobinId, total);
    }
}
