import React from 'react';
import { Box, Data, DataTable, Text } from 'grommet';

// Detail view for a single procurement, rendered inside one of HistoryView's
// accordion panels. persons/coffees are used only to resolve
// payeeId/comradeId/brewId -> readable names; lineItems is the full
// (unfiltered) list loaded in App, scoped here to this procurement.
export default function ProcurementView({ procurement, persons, coffees, lineItems }) {
  const items = lineItems
    .filter((li) => li.procurementId === procurement.id)
    .map((li) => {
      const brew = coffees.find((c) => c.id === li.brewId);
      return {
        id: li.id,
        person: persons.find((p) => p.id === li.comradeId)?.name ?? 'Unknown',
        brew: brew?.name ?? 'Unknown',
        price: brew?.price ?? 0,
      };
    });

  const total = items.reduce((sum, item) => sum + Number(item.price), 0);
  const payeeName = persons.find((p) => p.id === procurement.payeeId)?.name ?? 'Unassigned';

  // Column-level "footer" renders a separate row below a divider line, below
  // the line items -- matches the grommet Data/Data/Simple storybook pattern.
  const columns = [
    {
      property: 'person',
      header: 'Person',
      primary: true,
      footer: <b><Text color="#01A982">{payeeName}</Text></b>,
    },
    { property: 'brew', header: 'Brew' },
    {
      property: 'price',
      header: 'Price',
      align: 'end',
      render: (datum) => `$${datum.price}`,
      footer: <b><Text color="#01A982">${total.toFixed(2)}</Text></b>,
    },
  ];

  return (
    <Box align="center" justify="start" pad={{ horizontal: 'medium', vertical: 'xsmall' }} gap="xsmall">
      <Data data={items}>
        <DataTable columns={columns} primaryKey="id" />
      </Data>
    </Box>
  );
}
