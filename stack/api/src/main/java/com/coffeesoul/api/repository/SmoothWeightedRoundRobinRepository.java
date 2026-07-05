package com.coffeesoul.api.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class SmoothWeightedRoundRobinRepository {

    private final JdbcTemplate jdbc;

    public SmoothWeightedRoundRobinRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<UUID> findFirstId() {
        return jdbc.query(
                "SELECT id FROM smooth_weighted_round_robin ORDER BY id LIMIT 1",
                (rs, rowNum) -> rs.getObject("id", UUID.class))
                .stream().findFirst();
    }

    public UUID create() {
        return jdbc.queryForObject(
                "INSERT INTO smooth_weighted_round_robin DEFAULT VALUES RETURNING id",
                (rs, rowNum) -> rs.getObject("id", UUID.class));
    }
}
