package com.coffeesoul.api.repository;

import com.coffeesoul.api.web.dto.ProcurementResponse;
import com.coffeesoul.api.web.dto.ProcurementTotalResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class ProcurementRepository {

    // v_procurement_total: sum of line-item brew prices per procurement (0 when
    // it has no line items). See db/schema.sql.
    private static final RowMapper<ProcurementTotalResponse> TOTAL_ROW_MAPPER = (rs, rowNum) ->
            new ProcurementTotalResponse(
                    rs.getObject("procurement_id", UUID.class),
                    rs.getBigDecimal("total"));

    // total is left null here; used by every query that doesn't join
    // v_procurement_total (create/find/update/finalize -- finalize populates
    // it separately via ProcurementResponse.withTotal()).
    private static final RowMapper<ProcurementResponse> ROW_MAPPER = (rs, rowNum) -> {
        OffsetDateTime timestamp = rs.getObject("timestamp", OffsetDateTime.class);
        return new ProcurementResponse(
                rs.getObject("id", UUID.class),
                timestamp != null ? timestamp.toInstant() : null,
                rs.getObject("payee_id", UUID.class),
                rs.getObject("round_robin_id", UUID.class),
                null);
    };

    // Same as ROW_MAPPER but reads the `total` column joined in from
    // v_procurement_total; only findAll() selects that column.
    private static final RowMapper<ProcurementResponse> ROW_MAPPER_WITH_TOTAL = (rs, rowNum) -> {
        OffsetDateTime timestamp = rs.getObject("timestamp", OffsetDateTime.class);
        return new ProcurementResponse(
                rs.getObject("id", UUID.class),
                timestamp != null ? timestamp.toInstant() : null,
                rs.getObject("payee_id", UUID.class),
                rs.getObject("round_robin_id", UUID.class),
                rs.getBigDecimal("total"));
    };

    private final JdbcTemplate jdbc;

    public ProcurementRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // timestamp is nullable here so the caller can defer to the column's
    // DEFAULT now(); COALESCE keeps that default when null is passed.
    public ProcurementResponse create(Instant timestamp, UUID payeeId) {
        return jdbc.queryForObject(
                "INSERT INTO procurement (\"timestamp\", payee_id) VALUES (COALESCE(?, now()), ?) "
                        + "RETURNING id, \"timestamp\", payee_id, round_robin_id",
                ROW_MAPPER, toOffset(timestamp), payeeId);
    }

    // v_procurement_total has exactly one row per procurement (COALESCE(SUM,0)
    // covers the no-line-items case), so a plain JOIN is safe -- it never
    // drops a procurement.
    public List<ProcurementResponse> findAll() {
        return jdbc.query(
                "SELECT p.id, p.\"timestamp\", p.payee_id, p.round_robin_id, vpt.total "
                        + "FROM procurement p "
                        + "JOIN v_procurement_total vpt ON vpt.procurement_id = p.id "
                        + "ORDER BY p.\"timestamp\"",
                ROW_MAPPER_WITH_TOTAL);
    }

    public Optional<ProcurementResponse> findById(UUID id) {
        return jdbc.query(
                "SELECT id, \"timestamp\", payee_id, round_robin_id FROM procurement WHERE id = ?",
                ROW_MAPPER, id).stream().findFirst();
    }

    public Optional<ProcurementResponse> update(UUID id, Instant timestamp, UUID payeeId) {
        return jdbc.query(
                "UPDATE procurement SET \"timestamp\" = COALESCE(?, now()), payee_id = ? WHERE id = ? "
                        + "RETURNING id, \"timestamp\", payee_id, round_robin_id",
                ROW_MAPPER, toOffset(timestamp), payeeId, id).stream().findFirst();
    }

    public boolean delete(UUID id) {
        return jdbc.update("DELETE FROM procurement WHERE id = ?", id) > 0;
    }

    // line_item rows go with their procurement via ON DELETE CASCADE (see
    // V1__init_schema.sql) -- brew/coffee_comrade are untouched, they aren't
    // referenced by this table.
    public void deleteAll() {
        jdbc.update("DELETE FROM procurement");
    }

    // procurements that have already gone through WeightedRoundRobinService's
    // finalize step, oldest first -- used to replay history and rebuild
    // in-memory comrade weights on startup.
    public List<ProcurementResponse> findAllFinalized() {
        return jdbc.query(
                "SELECT id, \"timestamp\", payee_id, round_robin_id FROM procurement "
                        + "WHERE payee_id IS NOT NULL ORDER BY \"timestamp\"",
                ROW_MAPPER);
    }

    public Optional<ProcurementResponse> finalize(UUID id, UUID payeeId, UUID roundRobinId) {
        return jdbc.query(
                "UPDATE procurement SET payee_id = ?, round_robin_id = ? WHERE id = ? "
                        + "RETURNING id, \"timestamp\", payee_id, round_robin_id",
                ROW_MAPPER, payeeId, roundRobinId, id).stream().findFirst();
    }

    public List<ProcurementTotalResponse> findAllTotals() {
        return jdbc.query(
                "SELECT procurement_id, total FROM v_procurement_total ORDER BY procurement_id",
                TOTAL_ROW_MAPPER);
    }

    public Optional<ProcurementTotalResponse> findTotalById(UUID id) {
        return jdbc.query(
                "SELECT procurement_id, total FROM v_procurement_total WHERE procurement_id = ?",
                TOTAL_ROW_MAPPER, id).stream().findFirst();
    }

    private static OffsetDateTime toOffset(Instant instant) {
        return instant != null ? instant.atOffset(ZoneOffset.UTC) : null;
    }
}
