package com.coffeesoul.api.repository;

import com.coffeesoul.api.domain.Brew;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class BrewRepository {

    private static final RowMapper<Brew> ROW_MAPPER = (rs, rowNum) -> new Brew(
            rs.getObject("id", UUID.class),
            rs.getString("name"),
            rs.getBigDecimal("price"),
            rs.getString("description"));

    private final JdbcTemplate jdbc;

    public BrewRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Brew create(String name, BigDecimal price, String description) {
        return jdbc.queryForObject(
                "INSERT INTO brew (name, price, description) VALUES (?, ?, ?) "
                        + "RETURNING id, name, price, description",
                ROW_MAPPER, name, price, description);
    }

    public List<Brew> findAll() {
        return jdbc.query("SELECT id, name, price, description FROM brew ORDER BY name", ROW_MAPPER);
    }

    public Optional<Brew> findById(UUID id) {
        return jdbc.query("SELECT id, name, price, description FROM brew WHERE id = ?", ROW_MAPPER, id)
                .stream().findFirst();
    }

    public Optional<Brew> update(UUID id, String name, BigDecimal price, String description) {
        return jdbc.query(
                "UPDATE brew SET name = ?, price = ?, description = ? WHERE id = ? "
                        + "RETURNING id, name, price, description",
                ROW_MAPPER, name, price, description, id).stream().findFirst();
    }

    public boolean delete(UUID id) {
        return jdbc.update("DELETE FROM brew WHERE id = ?", id) > 0;
    }
}
