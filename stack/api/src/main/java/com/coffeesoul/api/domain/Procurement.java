package com.coffeesoul.api.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Procurement {
    private final UUID id;
    private Instant timestamp;
    private final List<LineItem> items = new ArrayList<>();
    private CoffeeComrade payee;

    public Procurement() {
        this.id = UUID.randomUUID();
        this.timestamp = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public List<LineItem> getItems() {
        return items;
    }

    public CoffeeComrade getPayee() {
        return payee;
    }

    public void setPayee(CoffeeComrade payee) {
        this.payee = payee;
    }

    public void addLineItem(LineItem lineItem) {
        items.add(lineItem);
    }

    public void removeLineItem(LineItem lineItem) {
        items.remove(lineItem);
    }

    public BigDecimal calculateTotal() {
        return items.stream()
                .map(item -> item.getBrew().getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder(
                "%s: %s. payee %s. items:\n".formatted(id, timestamp, payee));
        for (LineItem item : items) {
            sb.append("  ").append(item).append("\n");
        }
        return sb.toString();
    }
}
