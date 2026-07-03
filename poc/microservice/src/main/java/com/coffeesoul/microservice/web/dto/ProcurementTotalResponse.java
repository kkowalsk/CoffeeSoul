package com.coffeesoul.microservice.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProcurementTotalResponse(
        UUID procurementId,
        BigDecimal total) {
}
