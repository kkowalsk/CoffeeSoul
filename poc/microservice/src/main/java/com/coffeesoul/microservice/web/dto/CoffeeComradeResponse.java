package com.coffeesoul.microservice.web.dto;

import java.util.UUID;

public record CoffeeComradeResponse(
        UUID id,
        String name,
        UUID defaultBrewId) {
}
