import React from 'react';
import { DataChart, Heading } from 'grommet';

// Categorical palette, slots 1-8 in fixed order (see the dataviz skill's
// references/palette.md -- validated: worst adjacent CVD ΔE 24.2 in light
// mode). Coffee Soul's comrade list is expected to stay well under 8; a 9th
// comrade should fold into an "Other" bucket rather than extend this array
// (cycling/generating a hue past 8 breaks the CVD-safety ordering).
const CATEGORICAL_COLORS = [
  '#2a78d6', // blue
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
  '#e87ba4', // magenta
  '#eb6834', // orange
];

// One row per procurement, in chronological order, so every comrade's line
// plots against the same x-axis points. Each row carries every comrade's
// running balance as of that procurement: cumulative(their line item spend)
// minus cumulative(procurement totals they've actually paid as payee).
// Positive means they've consumed more than they've paid for; negative means
// they're ahead. An unfinalized procurement (no payeeId yet) still counts
// toward spend -- you owe as soon as you order -- but not yet toward anyone's
// paid total, since no one has paid it.
const balanceSeries = (persons, lineItems, coffees, procurements) => {
  const running = new Map(persons.map((person) => [person.id, 0]));
  const sorted = [...procurements].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return sorted.map((procurement) => {
    lineItems
      .filter((li) => li.procurementId === procurement.id)
      .forEach((li) => {
        const price = coffees.find((c) => c.id === li.brewId)?.price ?? 0;
        running.set(li.comradeId, (running.get(li.comradeId) ?? 0) + Number(price));
      });
    if (procurement.payeeId) {
      running.set(procurement.payeeId, (running.get(procurement.payeeId) ?? 0) - Number(procurement.total));
    }

    const row = { timestamp: procurement.timestamp };
    persons.forEach((person) => {
      row[person.id] = running.get(person.id);
    });
    return row;
  });
};

// Running-balance-over-time chart: one line (with dot markers at each
// procurement) per comrade, zero as the baseline with values free to go
// positive or negative around it. Meant to sit above MetricsView's
// per-comrade accordion so every comrade's trend is visible at once.
export default function NetBalanceView({ persons, coffees, lineItems, procurements }) {
  const data = balanceSeries(persons, lineItems, coffees, procurements);

  // DataChart's line rendering needs at least two points to draw a line --
  // and there's nothing to trend on before the first procurement anyway.
  if (data.length < 2) return null;

  return (
    <>
      <Heading level={3} size="small" margin={{ bottom: 'xsmall', top: 'none' }}>
        Running Balance
      </Heading>
      <DataChart
        data={data}
        series={['timestamp', ...persons.map((person) => ({ property: person.id, label: person.name }))]}
        chart={persons.map((person, index) => ({
          property: person.id,
          type: 'line',
          point: 'circle',
          thickness: 'xsmall',
          color: CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length],
        }))}
        axis={{ x: { property: 'timestamp' }, y: true }}
        guide
        legend
        detail
        size={{ height: '300px', width: 'fill' }}
      />
    </>
  );
}
