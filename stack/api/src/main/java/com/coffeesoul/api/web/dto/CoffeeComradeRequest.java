package com.coffeesoul.api.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

// name required; coffee_comrade has no description column, so the optional
// field here is default_brew_id (nullable FK to brew).
public record CoffeeComradeRequest(
        @NotBlank String name,
        UUID defaultBrewId) {
}
