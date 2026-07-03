package com.coffeesoul.api.domain;

import java.math.BigDecimal;
import java.util.UUID;

public class Brew {
    private final UUID id;
    private final String name;
    private final BigDecimal price;
    private final String description;

    public Brew(String name, BigDecimal price, String description) {
        this(UUID.randomUUID(), name, price, description);
    }

    public Brew(UUID id, String name, BigDecimal price, String description) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.description = description;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getDescription() {
        return description;
    }

    @Override
    public String toString() {
        return "%s: %s - $%s - %s".formatted(id, name, price, description);
    }
}
