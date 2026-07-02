-- Schema derived from poc/uml.puml and the classes in poc/poc.py.
--
-- Mapping notes:
--   CoffeeComrade  -> coffee_comrade
--   Brew           -> brew
--   Procurement    -> procurement
--   LineItem       -> line_item          (procurement_id added; the python
--                                          class has no back-reference to
--                                          Procurement, but the puml
--                                          "contains" association and
--                                          Procurement.items require the FK)
--   SmoothWeightedRoundRobin -> smooth_weighted_round_robin
--
-- Procurement.total is marked "(calculated)" in the puml -- it is derived
-- from line_item/brew prices rather than stored, so it's exposed as a view
-- (v_procurement_total) instead of a column.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE brew (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    price       numeric(6,2) NOT NULL,
    description text
);

-- cc "0..+" -- "0..1" br : has default
CREATE TABLE coffee_comrade (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    default_brew_id uuid REFERENCES brew(id)
);

CREATE TABLE smooth_weighted_round_robin (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- pr "0..+" -- "1" cc : payee
-- pr "0..+" -- "1" rr : processed
CREATE TABLE procurement (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "timestamp"    timestamptz NOT NULL DEFAULT now(),
    payee_id       uuid REFERENCES coffee_comrade(id),
    round_robin_id uuid REFERENCES smooth_weighted_round_robin(id)
);

-- pr "1..+" -- "1" li : contains
-- li "0..*" -- "1" br : has
-- cc "1" -- "0..+" li : on
CREATE TABLE line_item (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    procurement_id uuid NOT NULL REFERENCES procurement(id) ON DELETE CASCADE,
    comrade_id     uuid NOT NULL REFERENCES coffee_comrade(id),
    brew_id        uuid NOT NULL REFERENCES brew(id)
);

CREATE INDEX idx_coffee_comrade_default_brew_id ON coffee_comrade(default_brew_id);
CREATE INDEX idx_procurement_payee_id ON procurement(payee_id);
CREATE INDEX idx_procurement_round_robin_id ON procurement(round_robin_id);
CREATE INDEX idx_line_item_procurement_id ON line_item(procurement_id);
CREATE INDEX idx_line_item_comrade_id ON line_item(comrade_id);
CREATE INDEX idx_line_item_brew_id ON line_item(brew_id);

-- Procurement.calculateTotal(): sum of line item brew prices.
CREATE VIEW v_procurement_total AS
SELECT p.id AS procurement_id, COALESCE(SUM(b.price), 0)::numeric(8,2) AS total
FROM procurement p
LEFT JOIN line_item li ON li.procurement_id = p.id
LEFT JOIN brew b ON b.id = li.brew_id
GROUP BY p.id;
