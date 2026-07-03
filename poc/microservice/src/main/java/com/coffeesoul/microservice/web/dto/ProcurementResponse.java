package com.coffeesoul.microservice.web.dto;

import java.time.Instant;
import java.util.UUID;

public record ProcurementResponse(
        UUID id,
        Instant timestamp,
        UUID payeeId,
        UUID roundRobinId) {
}
