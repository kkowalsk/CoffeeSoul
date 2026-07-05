package com.coffeesoul.api.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

// name/price required, description optional
public record BrewRequest(
        @NotBlank String name,
        @NotNull BigDecimal price,
        String description) {
}
