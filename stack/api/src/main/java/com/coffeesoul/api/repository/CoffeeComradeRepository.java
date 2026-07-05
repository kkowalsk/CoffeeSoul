package com.coffeesoul.api.repository;

import com.coffeesoul.api.web.dto.CoffeeComradeResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class CoffeeComradeRepository {

    private static final RowMapper<CoffeeComradeResponse> ROW_MAPPER = (rs, rowNum) -> new CoffeeComradeResponse(
            rs.getObject("id", UUID.class),
            rs.getString("name"),
            rs.getObject("default_brew_id", UUID.class));

    private final JdbcTemplate jdbc;

    public CoffeeComradeRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public CoffeeComradeResponse create(String name, UUID defaultBrewId) {
        return jdbc.queryForObject(
                "INSERT INTO coffee_comrade (name, default_brew_id) VALUES (?, ?) "
                        + "RETURNING id, name, default_brew_id",
                ROW_MAPPER, name, defaultBrewId);
    }

    public List<CoffeeComradeResponse> findAll() {
        return jdbc.query("SELECT id, name, default_brew_id FROM coffee_comrade ORDER BY name", ROW_MAPPER);
    }

    public Optional<CoffeeComradeResponse> findById(UUID id) {
        return jdbc.query("SELECT id, name, default_brew_id FROM coffee_comrade WHERE id = ?", ROW_MAPPER, id)
                .stream().findFirst();
    }

    public Optional<CoffeeComradeResponse> update(UUID id, String name, UUID defaultBrewId) {
        return jdbc.query(
                "UPDATE coffee_comrade SET name = ?, default_brew_id = ? WHERE id = ? "
                        + "RETURNING id, name, default_brew_id",
                ROW_MAPPER, name, defaultBrewId, id).stream().findFirst();
    }

    public boolean delete(UUID id) {
        return jdbc.update("DELETE FROM coffee_comrade WHERE id = ?", id) > 0;
    }
}
