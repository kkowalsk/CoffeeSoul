package com.coffeesoul.api.domain;

import java.util.UUID;

public class LineItem {
    private final UUID id;
    private final CoffeeComrade comrade;
    private final Brew brew;

    public LineItem(CoffeeComrade comrade, Brew brew) {
        this.id = UUID.randomUUID();
        this.comrade = comrade;
        this.brew = brew;
    }

    public UUID getId() {
        return id;
    }

    public CoffeeComrade getComrade() {
        return comrade;
    }

    public Brew getBrew() {
        return brew;
    }

    @Override
    public String toString() {
        return "%s: line item - %s for %s".formatted(id, brew.getName(), comrade.getName());
    }
}
