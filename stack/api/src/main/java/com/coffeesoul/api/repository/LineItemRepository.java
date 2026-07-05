package com.coffeesoul.api.repository;

import com.coffeesoul.api.web.dto.LineItemResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class LineItemRepository {

    // amount a single comrade contributed to a single procurement (sum of
    // that comrade's line-item brew prices within it) -- the input the
    // weighted round robin needs, without pulling in full Brew/CoffeeComrade
    // objects.
    public record ComradeAmount(UUID procurementId, UUID comradeId, BigDecimal amount) {
    }

    private static final RowMapper<LineItemResponse> ROW_MAPPER = (rs, rowNum) -> new LineItemResponse(
            rs.getObject("id", UUID.class),
            rs.getObject("procurement_id", UUID.class),
            rs.getObject("comrade_id", UUID.class),
            rs.getObject("brew_id", UUID.class));

    private static final RowMapper<ComradeAmount> COMRADE_AMOUNT_ROW_MAPPER = (rs, rowNum) -> new ComradeAmount(
            rs.getObject("procurement_id", UUID.class),
            rs.getObject("comrade_id", UUID.class),
            rs.getBigDecimal("amount"));

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

    // per-comrade contribution within a single procurement, for finalizing
    // that order. Ordered by comrade_id so ties in the round robin's weight
    // comparison break the same way every time a given set of comrades
    // shares an order (line_item has no sequence/created-at column to order
    // by actual arrival, so this is the closest deterministic proxy).
    public List<ComradeAmount> findAmountsByComradeForProcurement(UUID procurementId) {
        return jdbc.query(
                "SELECT li.procurement_id, li.comrade_id, SUM(b.price) AS amount "
                        + "FROM line_item li JOIN brew b ON b.id = li.brew_id "
                        + "WHERE li.procurement_id = ? "
                        + "GROUP BY li.procurement_id, li.comrade_id "
                        + "ORDER BY li.comrade_id",
                COMRADE_AMOUNT_ROW_MAPPER, procurementId);
    }

    // per-comrade contribution for every procurement, for replaying history
    // on startup. Grouped in the query so it's one round trip regardless of
    // how many procurements exist; ordered the same way as above so a replay
    // ties-break identically to the live finalize call did.
    public List<ComradeAmount> findAmountsByComradeGroupedByProcurement() {
        return jdbc.query(
                "SELECT li.procurement_id, li.comrade_id, SUM(b.price) AS amount "
                        + "FROM line_item li JOIN brew b ON b.id = li.brew_id "
                        + "GROUP BY li.procurement_id, li.comrade_id "
                        + "ORDER BY li.procurement_id, li.comrade_id",
                COMRADE_AMOUNT_ROW_MAPPER);
    }
}
