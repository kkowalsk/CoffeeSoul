package com.coffeesoul.microservice.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// inspiration pulled from here
// https://oneuptime.com/blog/post/2026-01-30-weighted-round-robin/view
public class SmoothWeightedRoundRobin {
    private final UUID id = UUID.randomUUID();
    private final List<Procurement> procurements = new ArrayList<>();
    private final Map<CoffeeComrade, BigDecimal> comradeWeights = new LinkedHashMap<>();
    private final Map<CoffeeComrade, BigDecimal> comradeTotals = new LinkedHashMap<>();
    private final Map<CoffeeComrade, Integer> comradePayments = new LinkedHashMap<>();
    private final boolean enforceOrder;

    public SmoothWeightedRoundRobin(boolean enforceOrder) {
        this.enforceOrder = enforceOrder;
    }

    public UUID getId() {
        return id;
    }

    public List<Procurement> getProcurements() {
        return procurements;
    }

    // use to build up a history for testing
    public void add(Procurement procurement) {
        if (enforceOrder) {
            throw new IllegalStateException("insertion-based enforcement configured");
        }

        procurements.add(procurement);
        for (LineItem item : procurement.getItems()) {
            comradeWeights.putIfAbsent(item.getComrade(), BigDecimal.ZERO);
            comradeTotals.putIfAbsent(item.getComrade(), BigDecimal.ZERO);
            comradePayments.putIfAbsent(item.getComrade(), 0);
        }
    }

    // insertion based enforcement
    public void process(Procurement procurement) {
        if (!enforceOrder) {
            throw new IllegalStateException("insertion enforcement not configured");
        }

        procurement.setTimestamp(Instant.now());
        procurements.add(procurement);
        for (LineItem item : procurement.getItems()) {
            comradeWeights.putIfAbsent(item.getComrade(), BigDecimal.ZERO);
            comradeTotals.putIfAbsent(item.getComrade(), BigDecimal.ZERO);
            comradePayments.putIfAbsent(item.getComrade(), 0);
        }

        BigDecimal total = procurement.calculateTotal();
        for (LineItem item : procurement.getItems()) {
            BigDecimal price = item.getBrew().getPrice();
            comradeWeights.merge(item.getComrade(), price, BigDecimal::add);
            comradeTotals.merge(item.getComrade(), price, BigDecimal::add);
        }

        CoffeeComrade payee = null;
        for (Map.Entry<CoffeeComrade, BigDecimal> entry : comradeWeights.entrySet()) {
            if (payee == null || entry.getValue().compareTo(comradeWeights.get(payee)) > 0) {
                payee = entry.getKey();
            }
        }
        comradeWeights.merge(payee, total.negate(), BigDecimal::add);
        comradePayments.merge(payee, 1, Integer::sum);
        procurement.setPayee(payee);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        for (Procurement p : procurements) {
            sb.append(p).append("\n");
        }
        return sb.toString();
    }
}
