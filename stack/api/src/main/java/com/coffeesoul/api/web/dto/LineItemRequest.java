package com.coffeesoul.api.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

// comrade + brew required. procurement_id is NOT NULL in the schema (a line
// item cannot exist without a parent procurement), so it is required too --
// this is the "line items added via a separate request" flow: create the
// procurement first, then POST line items referencing it.
public record LineItemRequest(
        @NotNull UUID procurementId,
        @NotNull UUID comradeId,
        @NotNull UUID brewId) {
}
