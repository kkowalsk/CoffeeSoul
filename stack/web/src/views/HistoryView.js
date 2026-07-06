import React, { useState } from 'react';
import { 
  Accordion,
  AccordionPanel,
  Box,
  Heading,
  Paragraph,
  Text
} from 'grommet';
import ProcurementView from './ProcurementView';

// The "History" tab: one accordion panel per procurement, newest first. The
// number of panels is driven entirely by however many procurements were
// loaded -- procurements/persons are fetched in App (same pattern as the
// other tabs) and passed in here. Each panel's body is a ProcurementView.
export default function HistoryView({ procurements, persons, coffees, lineItems }) {
  // Number orders by when they were actually placed (1 = earliest) before
  // reversing to newest-first for display, so the numbering stays stable
  // regardless of sort/display order.
  const numbered = [...procurements]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((procurement, index) => ({ ...procurement, orderNumber: index + 1 }));
  const newestFirst = [...numbered].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );

  // Controlling the Accordion ourselves (rather than leaving it uncontrolled)
  // is what lets the label know whether ITS OWN panel is the expanded one,
  // so the grey background can extend to the title row, not just the body.
  const [activeIndexes, setActiveIndexes] = useState([]);

  return (
    <>
      <Heading level={2}>
        Order History
      </Heading>
      <Paragraph fill>
        View a chronological history of past orders.
      </Paragraph>
      <Box pad="medium">
        <Accordion gap="small" activeIndex={activeIndexes} onActive={setActiveIndexes}>
          {newestFirst.map((procurement, index) => (
            <AccordionPanel
              key={procurement.id}
              label={panelLabel(procurement, persons, activeIndexes.includes(index))}
            >
              {/* This Box only renders while the panel is expanded (AccordionPanel
                  unmounts its children when collapsed), so the background only
                  shows up on whichever panel is currently open. */}
              <Box background="light-2">
                <ProcurementView
                  procurement={procurement}
                  persons={persons}
                  coffees={coffees}
                  lineItems={lineItems}
                />
              </Box>
            </AccordionPanel>
          ))}
        </Accordion>
      </Box>
    </>
  );
}

// AccordionPanel only applies its themed padding + Heading typography when
// label is a plain string -- anything else (a custom node) is rendered raw,
// with none of that theming. So to add a real line break here without losing
// the accordion's look, we rebuild that same Box/Heading treatment by hand
// (theme.accordion.label.container.pad and theme.accordion.heading.level in
// the default grommet theme) rather than substituting in plain Text.
const panelLabel = (procurement, persons, isActive) => {
  const date = procurement.timestamp ? new Date(procurement.timestamp).toLocaleString() : 'Unknown time';
  const payeeName = persons.find((p) => p.id === procurement.payeeId)?.name ?? 'Unassigned';
  return (
    <Box
      fill="horizontal"
      pad={{ horizontal: 'xsmall' }}
      gap="xxsmall"
      background={isActive ? 'light-2' : undefined}
    >
      <Heading level={4} margin="none">{`Order ${procurement.orderNumber} @ ${date}`}</Heading>
      <Heading level={4} margin="none">
        Payee: {isActive ? <Text color="#01A982">{payeeName}</Text> : payeeName}
      </Heading>
    </Box>
  );
};
