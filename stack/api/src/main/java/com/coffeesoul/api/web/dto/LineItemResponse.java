package com.coffeesoul.api.web.dto;

import java.util.UUID;

public record LineItemResponse(
        UUID id,
        UUID procurementId,
        UUID comradeId,
        UUID brewId) {
}
