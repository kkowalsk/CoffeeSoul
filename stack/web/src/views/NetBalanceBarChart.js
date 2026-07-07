import React from 'react';
import { DataChart, Heading, Text } from 'grommet';

const NEG_COLOR = '#e34948';
const POS_COLOR = '#2a78d6';
const HIGHEST_COLOR = '#59D420';
const barColor = (balance, highest) => {
  if (balance === highest) return HIGHEST_COLOR;
  if (balance < 0) return NEG_COLOR;
  return POS_COLOR;
};

// Each person's CURRENT net balance: total spend (their own line items,
// across every order) minus total paid (procurement totals for orders
// they've actually been finalized as payee on). Positive means they've
// consumed more than they've paid for; negative means they're ahead. Unlike
// NetBalanceView's running-balance-over-time chart, this only needs the
// final snapshot, so there's no chronological replay -- just two sums.
const currentBalances = (persons, lineItems, coffees, procurements) =>
  persons.map((person) => {
    const spend = lineItems
      .filter((li) => li.comradeId === person.id)
      .reduce((sum, li) => sum + Number(coffees.find((c) => c.id === li.brewId)?.price ?? 0), 0);
    const paid = procurements
      .filter((p) => p.payeeId === person.id)
      .reduce((sum, p) => sum + Number(p.total ?? 0), 0);
    return { label: person.name, balance: Math.round((spend - paid) * 100) / 100 };
  });

// DataChart's per-datapoint color (chart.property.color) requires
// chart.property.x to be numeric -- calcBounds() takes min/max of it, which
// is NaN for the string 'label' field and silently drops every bar. This
// synthetic row index gives it a numeric x while 'label' still drives the
// axis tick text (looked up by row position, independent of the chart's x).
const withRowIndex = (data) => data.map((d, x) => ({ ...d, x }));

// Rotated 90deg so every person's name fits without overlapping its
// neighbors -- horizontal labels collide once there are more than a
// handful of bars.
const verticalLabel = (label) => (
  <Text size="small" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}>
    {label}
  </Text>
);

// Reusable snapshot bar chart: one bar per person, zero as the baseline,
// bars free to run positive or negative around it. Meant to be dropped into
// any view that wants an at-a-glance "who's ahead / behind right now" --
// unlike NetBalanceView it's a single point in time, not a trend.
export default function NetBalanceBarChart({ persons, coffees, lineItems, procurements }) {
  const data = withRowIndex(currentBalances(persons, lineItems, coffees, procurements));
  const highest = data.length ? Math.max(...data.map((d) => d.balance)) : undefined;

  return (
    <>
      <Heading level={3} size="small" margin={{ bottom: 'xsmall', top: 'none' }}>
        Net Balance (i.e. Should've paid - Actual paid)
      </Heading>
      {data.length === 0 || procurements.length === 0 ? (
        <Text color="dark-4">No people/data yet.</Text>
      ) : (
        <DataChart
          data={data}
          series={[
            { property: 'x' },
            { property: 'label', render: verticalLabel },
            // prefix carries through to the y-axis ticks too -- DataChart
            // borrows the series matching axis.y.property's prefix/render to
            // format the shared y-axis, not just this series' own tooltip.
            { property: 'balance', prefix: '$' },
          ]}
          // property as an object (rather than the plain 'balance' string)
          // is what lets each bar get its own color -- DataChart reads
          // color.transform(value) per datapoint instead of one flat hue
          // for the whole series.
          chart={{
            property: { x: 'x', y: 'balance', color: { property: 'balance', transform: (v) => barColor(v, highest) } },
            type: 'bar',
            thickness: 'small',
          }}
          axis={{
            // 'fine' forces one tick per row -- the default 'coarse' only
            // labels a couple of bars, leaving the rest unlabeled.
            x: { property: 'label', granularity: 'fine' },
            y: { property: 'balance', granularity: 'fine' },
          }}
          guide={{ x: {}, y: { granularity: 'fine' } }}
          // taller than a plain-text-label chart would need, to leave room
          // for the now-vertical (and therefore taller) x-axis labels --
          // a fixed height that only fit the plot would clip them.
          size={{ height: '280px', width: 'fill' }}
        />
      )}
    </>
  );
}
