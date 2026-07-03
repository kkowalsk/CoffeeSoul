package com.coffeesoul.microservice.web.dto;

import java.util.UUID;

public record LineItemResponse(
        UUID id,
        UUID procurementId,
        UUID comradeId,
        UUID brewId) {
}
