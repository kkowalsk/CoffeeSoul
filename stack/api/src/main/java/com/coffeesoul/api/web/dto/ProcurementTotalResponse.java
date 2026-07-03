package com.coffeesoul.api.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProcurementTotalResponse(
        UUID procurementId,
        BigDecimal total) {
}
