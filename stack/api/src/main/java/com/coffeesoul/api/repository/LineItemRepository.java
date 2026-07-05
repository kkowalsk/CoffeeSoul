package com.coffeesoul.api.repository;

import com.coffeesoul.api.web.dto.LineItemResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class LineItemRepository {

    private static final RowMapper<LineItemResponse> ROW_MAPPER = (rs, rowNum) -> new LineItemResponse(
            rs.getObject("id", UUID.class),
            rs.getObject("procurement_id", UUID.class),
            rs.getObject("comrade_id", UUID.class),
            rs.getObject("brew_id", UUID.class));

    private final JdbcTemplate jdbc;

    public LineItemRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public LineItemResponse create(UUID procurementId, UUID comradeId, UUID brewId) {
        return jdbc.queryForObject(
                "INSERT INTO line_item (procurement_id, comrade_id, brew_id) VALUES (?, ?, ?) "
                        + "RETURNING id, procurement_id, comrade_id, brew_id",
                ROW_MAPPER, procurementId, comradeId, brewId);
    }

    public List<LineItemResponse> findAll() {
        return jdbc.query(
                "SELECT id, procurement_id, comrade_id, brew_id FROM line_item ORDER BY id", ROW_MAPPER);
    }

    public Optional<LineItemResponse> findById(UUID id) {
        return jdbc.query(
                "SELECT id, procurement_id, comrade_id, brew_id FROM line_item WHERE id = ?", ROW_MAPPER, id)
                .stream().findFirst();
    }

    public Optional<LineItemResponse> update(UUID id, UUID procurementId, UUID comradeId, UUID brewId) {
        return jdbc.query(
                "UPDATE line_item SET procurement_id = ?, comrade_id = ?, brew_id = ? WHERE id = ? "
                        + "RETURNING id, procurement_id, comrade_id, brew_id",
                ROW_MAPPER, procurementId, comradeId, brewId, id).stream().findFirst();
    }

    public boolean delete(UUID id) {
        return jdbc.update("DELETE FROM line_item WHERE id = ?", id) > 0;
    }
}
