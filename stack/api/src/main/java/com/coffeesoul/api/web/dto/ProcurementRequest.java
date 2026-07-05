package com.coffeesoul.api.web.dto;

import java.time.Instant;
import java.util.UUID;

// All fields optional. timestamp is updatable (PUT); when omitted it defaults
// to now(). payee_id is a nullable FK to coffee_comrade. round_robin_id is
// never set here -- SmoothWeightedRoundRobin is intentionally out of scope.
public record ProcurementRequest(
        Instant timestamp,
        UUID payeeId) {
}
