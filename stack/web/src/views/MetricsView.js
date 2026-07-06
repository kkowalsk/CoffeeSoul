import React, { useState } from 'react';
import { 
  Accordion,
  AccordionPanel,
  Box,
  Data,
  DataChart,
  DataTable,
  Heading,
  Paragraph,
  Text, 
  ThemeContext
} from 'grommet';

import NetBalanceView from './NetBalanceView';
import NetBalanceBarChart from './NetBalanceBarChart';

// DataChart draws bars from this palette by default (one entry per series).
// Overriding it locally (rather than passing a `chart` prop with a color) is
// what keeps each row bound to its OWN value -- adding an explicit `chart`
// prop here breaks that per-row binding and makes every bar render the same
// (last) value instead of its own.
const CHART_THEME = { dataChart: { colors: ['#4B4B4B'] } };

// The "Metrics" tab: one accordion panel per coffee comrade, listing every
// line item they've ever ordered. Same pattern as HistoryView -- persons/
// coffees/lineItems/procurements are loaded in App and passed straight
// through; the grey background only shows on whichever panel is expanded.
export default function MetricsView({ persons, coffees, lineItems, procurements }) {
  const [activeIndexes, setActiveIndexes] = useState([]);

  return (
    <>
      <Heading level={2}>
        Metrics
      </Heading>
      <Paragraph fill>
        View Metrics per Person aswell as overall stats.
        The last line in the table indicates how much the all the Line Items cost vs. how much the person paid vs. the difference between the two.
      </Paragraph>
      <Box
        border={{ color: 'border', size: 'small' }}
        round="small"
        pad="medium"
        gap="small"
        align="stretch"
      >
        <NetBalanceBarChart persons={persons} coffees={coffees} lineItems={lineItems} procurements={procurements} />
      </Box>
      
      <br></br>

      <Box
        border={{ color: 'border', size: 'small' }}
        round="small"
        pad="medium"
        gap="small"
        align="stretch"
      >
        <NetBalanceView persons={persons} coffees={coffees} lineItems={lineItems} procurements={procurements} />
      </Box>

      <br></br>

      <Box
        border={{ color: 'border', size: 'small' }}
        round="small"
        pad="medium"
        gap="small"
        align="stretch"
      >
      <Accordion fill="horizontal" gap="small" align="stretch" activeIndex={activeIndexes} onActive={setActiveIndexes}>
        {persons.map((comrade, index) => {
          const items = comradeLineItems(comrade, lineItems, coffees, procurements);
          const byBrew = brewBreakdown(items, coffees);
          return (
            <AccordionPanel
              key={comrade.id}
              label={panelLabel(comrade, activeIndexes.includes(index))}
            >
              {/* This Box only renders while the panel is expanded (AccordionPanel
                  unmounts its children when collapsed), so the background only
                  shows up on whichever panel is currently open. */}
              <Box background="light-2">
                <Box align="stretch" justify="start" pad={{ horizontal: 'medium', vertical: 'xsmall' }}>
                  <Data data={items}>
                    <DataTable
                      columns={columns(items)}
                      primaryKey="id"
                      size="300px"
                      pin={{ header: true, footer: true }}
                    />
                  </Data>

                  {/* How many times each brew was ordered. */}
                  <Heading level={4} size="small" margin={{ bottom: 'xsmall', top: 'medium' }}>
                    Brews Ordered
                  </Heading>
                  {byBrew.length > 1 ? (
                    <ThemeContext.Extend value={CHART_THEME}>
                      <DataChart
                        data={byBrew.map(({ label, count }) => ({ label, count }))}
                        series={[
                          { property: 'label', render: (label) => label },
                          { property: 'count' },
                        ]}
                        chart={{ property: 'count', thickness: 'small' }}
                        gap="none"
                        direction="horizontal"
                        size={{ height: 'small', width: 'fill' }}
                        bounds={{ x: axisMarkers(maxCount(byBrew)) }}
                        axis={{
                          x: { granularity: 'fine' },
                          y: { property: 'label', granularity: 'fine' },
                        }}
                        guide={{ x: { granularity: 'fine' }, y: { granularity: 'fine' } }}
                      />
                    </ThemeContext.Extend>
                  ) : (
                    // DataChart's horizontal bar + categorical y-axis crashes when
                    // there's only a single row (nothing to lay the axis out
                    // against), so fall back to plain text for a single brew.
                    <Text>{singleBrewSummary(byBrew, (entry) => `${entry.count}x`)}</Text>
                  )}

                  {/* Each brew's share of this comrade's total spend --
                      brew price * times ordered, in dollars. */}
                  <Heading level={4} size="small" margin={{ bottom: 'xsmall', top: 'medium' }}>
                    Dollars spent per Brew
                  </Heading>
                  {byBrew.length > 1 ? (
                    <ThemeContext.Extend value={CHART_THEME}>
                      <DataChart
                        data={byBrew.map(({ label, spend }) => ({ label, spend }))}
                        series={[
                          { property: 'label', render: (label) => label },
                          { property: 'spend', prefix: '$' },
                        ]}
                        chart={{ property: 'spend', thickness: 'small' }}
                        gap="none"
                        direction="horizontal"
                        size={{ height: 'small', width: 'fill' }}
                        axis={{
                          x: { granularity: 'fine' },
                          y: { property: 'label', granularity: 'fine' },
                        }}
                        guide={{ x: { granularity: 'fine' }, y: { granularity: 'fine' } }}
                      />
                    </ThemeContext.Extend>
                  ) : (
                    <Text>{singleBrewSummary(byBrew, (entry) => `$${entry.spend}`)}</Text>
                  )}
                </Box>
              </Box>
            </AccordionPanel>
          );
        })}
      </Accordion>
    </Box>
    </>
  );
}

// AccordionPanel only applies its themed padding + Heading typography when
// label is a plain string -- anything else (a custom node) is rendered raw,
// with none of that theming. So to add the isActive-conditional grey
// background here we rebuild that same Box/Heading treatment by hand,
// same as HistoryView's panelLabel.
const panelLabel = (comrade, isActive) => (
  <Box
    fill="horizontal"
    pad={{ horizontal: 'xsmall' }}
    background={isActive ? 'light-2' : undefined}
  >
    <Heading level={4} margin="none">{comrade.name}</Heading>
  </Box>
);

// Per-brew rollup of a comrade's line items: how many times they ordered it,
// and how much of their spend (brew price * times ordered) it accounts for.
// Seeded with EVERY coffee (zero counts included), not just ones this comrade
// actually ordered -- otherwise the y-axis category count varies per comrade
// (2 brews ordered vs. 6), making bar thickness/spacing inconsistent between
// accordion panels. Every panel's chart now shares the same fixed row set.
const brewBreakdown = (items, coffees) => {
  const byBrew = new Map();
  for (const coffee of coffees) {
    byBrew.set(coffee.name, { label: coffee.name, count: 0, spend: 0 });
  }
  for (const item of items) {
    const entry = byBrew.get(item.brew) ?? { label: item.brew, count: 0, spend: 0 };
    entry.count += 1;
    entry.spend += Number(item.price);
    byBrew.set(item.brew, entry);
  }
  return Array.from(byBrew.values()).map((entry) => ({
    label: entry.label,
    count: entry.count,
    spend: Math.round(entry.spend * 100) / 100,
  }));
};

// Counts are always whole numbers -- forcing the x-axis bounds to exactly
// [0, max count] (rather than letting DataChart auto-scale/round the max)
// is what keeps the tick values whole instead of fractional (e.g. 1.8x).
const maxCount = (byBrew) => byBrew.reduce((max, entry) => Math.max(max, entry.count), 1);

// DataChart's `bounds.x` array is rendered verbatim as the x-axis tick
// labels (it isn't used to scale the bars), so to get evenly spaced
// markers along the axis -- instead of just the two endpoints -- we
// build that array ourselves: whole-number steps up to (at most) 5
// points, so brew counts, which are always whole numbers, never render
// as fractional tick labels.
const axisMarkers = (max) => {
  const step = Math.max(1, Math.ceil(max / 4));
  const values = [];
  for (let value = 0; value < max; value += step) values.push(value);
  values.push(max);
  return values;
};

// Plain-text stand-in for the "not enough rows to chart" case (see
// byBrew.length > 1 checks above) -- covers both zero orders and exactly one.
const singleBrewSummary = (byBrew, formatValue) =>
  byBrew.length === 0 ? 'No orders yet' : `${byBrew[0].label}: ${formatValue(byBrew[0])}`;

// Newest first, same as HistoryView -- sorted by the raw timestamp (the
// formatted display string isn't safe to sort on).
const comradeLineItems = (comrade, lineItems, coffees, procurements) =>
  lineItems
    .filter((li) => li.comradeId === comrade.id)
    .map((li) => {
      const brew = coffees.find((c) => c.id === li.brewId);
      const procurement = procurements.find((p) => p.id === li.procurementId);
      // this comrade was the one who ended up paying for that order
      const isPayee = !!procurement && procurement.payeeId === comrade.id;
      return {
        id: li.id,
        procurementId: procurement?.id,
        timestamp: procurement?.timestamp,
        date: procurement?.timestamp ? new Date(procurement.timestamp).toLocaleString() : 'Unknown time',
        brew: brew?.name ?? 'Unknown',
        price: brew?.price ?? 0,
        isPayee,
        // only the payee actually paid the procurement's total; other rows leave it blank
        total: isPayee ? Number(procurement.total) : '',
      };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

// Bold + colored for rows belonging to an order this comrade paid for.
const cell = (value, isPayee) =>
  isPayee ? (
    <Text weight="bold" color="#01A982">
      {value}
    </Text>
  ) : (
    value
  );

// Column-level "footer" renders a separate row below a divider line, below
// the line items -- same DataTable footer pattern as ProcurementView.
const columns = (items) => {
  const total = items.reduce((sum, item) => sum + Number(item.price), 0);
  // A comrade can appear as payee on multiple line items from the SAME
  // procurement (they can order more than once per round) -- dedupe by
  // procurementId so each paid-for procurement's total is only counted once.
  const paidTotal = Array.from(
    items.reduce((byProcurement, item) => {
      if (item.isPayee) byProcurement.set(item.procurementId, Number(item.total));
      return byProcurement;
    }, new Map()).values()
  ).reduce((sum, procTotal) => sum + procTotal, 0);
  return [
    {
      property: 'date',
      header: 'Date',
      primary: true,
      render: (datum) => cell(datum.date, datum.isPayee),
    },
    {
      property: 'brew',
      header: 'Brew',
      render: (datum) => cell(datum.brew, datum.isPayee),
      footer: '',
    },
    {
      property: 'price',
      header: 'Price',
      align: 'end',
      render: (datum) => cell(`$${datum.price}`, datum.isPayee),
      footer: <Text><b>Costs</b><br></br>${total.toFixed(2)}</Text>,
    },
    {
      property: 'paid',
      header: 'Paid',
      align: 'end',
      render: (datum) => (datum.isPayee ? cell(`-$${datum.total.toFixed(2)}`, true) : ''),
      footer: <Text><b>Paid</b><br></br>-${paidTotal.toFixed(2)}</Text>,
    },
    {
      property: 'net',
      header: '',
      align: 'end',
      render: '',
      footer: <Text><b>Net</b><br></br>${(total - paidTotal).toFixed(2)}</Text>,
    },
  ];
};
