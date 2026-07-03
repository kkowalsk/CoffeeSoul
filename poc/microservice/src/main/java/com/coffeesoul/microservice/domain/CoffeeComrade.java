package com.coffeesoul.microservice.domain;

import java.util.UUID;

public class CoffeeComrade {
    private final UUID id;
    private final String name;
    private Brew brew;

    public CoffeeComrade(String name) {
        this(UUID.randomUUID(), name, null);
    }

    public CoffeeComrade(UUID id, String name, Brew brew) {
        this.id = id;
        this.name = name;
        this.brew = brew;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Brew getBrew() {
        return brew;
    }

    public void setBrew(Brew brew) {
        this.brew = brew;
    }

    @Override
    public String toString() {
        return "%s: %s%s".formatted(id, name, brew != null ? " drinkin' " + brew.getName() : "");
    }
}
