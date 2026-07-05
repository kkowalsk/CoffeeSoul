import React, { useState } from 'react';
import { Box, Button, Diagram, Paragraph, Stack, Text } from 'grommet';

// draw-in animation duration (ms) for a newly created connection
export const DRAW_MS = 1000;
// muted grey for connections belonging to non-selected coffees
const OTHER_LINE = 'rgba(120, 120, 120, 0.35)';

// A single mappable option box. Its `id` is what <Diagram> connections point at
// (fromTarget / toTarget), and it doubles as the click target.
const OptionBox = ({ id, label, active, onClick }) => (
  <Box
    id={id}
    onClick={onClick}
    pad="small"
    align="center"
    round="xsmall"
    background={active ? 'accent-4' : undefined}
    border={{ color: active ? 'accent-4' : 'border' }}
  >
    <Text>{label}</Text>
  </Box>
);

export const connection = (fromTarget, toTarget, { ...rest } = {}) => ({
  fromTarget,
  toTarget,
  anchor: 'horizontal',
  color: 'accent-4',
  thickness: 'xsmall',
  round: true,
  type: 'curved',
  ...rest,
});

// Reusable click handler: maps a person (toTarget) to exactly ONE coffee
// (fromTarget). Clicking the person's current coffee clears the mapping (flips
// it off); clicking from a different coffee moves the person there, deleting any
// prior mapping. So every person appears in at most one connection. Curried so
// you bind the setter once and reuse it:
//   const flip = flipConnection(setConnections);
//   ...onClick={() => flip(selectedCoffee, personId)}
export const flipConnection = (setConnections) => (fromTarget, toTarget) =>
  setConnections((prev) => {
    const alreadyMapped = prev.some(
      (c) => c.fromTarget === fromTarget && c.toTarget === toTarget,
    );
    // one coffee per person: drop any existing mapping for this person first
    const withoutPerson = prev.filter((c) => c.toTarget !== toTarget);
    return alreadyMapped
      ? withoutPerson
      : [...withoutPerson, connection(fromTarget, toTarget)];
  });

export const BusyButton = ({ onOrder }) => {
  const [busy, setBusy] = useState();
  const [success, setSuccess] = useState();

  return (
    <Box align="center" pad="medium">
    <Button
      primary
      busy={busy}
      success={success}
      label="Place Order"
      onClick={async () => {
        setBusy(true);
        try {
          await onOrder?.();
          setSuccess(true);
          setTimeout(() => setSuccess(false), 2000);
        } catch (e) {
          console.error('order failed', e);
        } finally {
          setBusy(false);
        }
      }}
    >
    </Button>
    </Box>
  )
};

BusyButton.parameters = { chromatic: {disabled: true }, };

// The "Order" tab: pick a coffee on the left, toggle people on the right to
// connect them, then place the order. All state (coffees/persons/connections/
// coffee/drawing/payee) and handlers live in App -- this is purely
// presentational.
export default function OrderView({
  coffees,
  persons,
  coffee,
  setCoffee,
  connections,
  drawing,
  isConnected,
  selectPerson,
  onPlaceOrder,
  payee,
}) {
  return (
    <>
      <Paragraph>
        Pick a coffee on the left, then toggle people on the right to connect
        them. Each coffee can map to 0..* people.
      </Paragraph>

      {/* interactiveChild="first" -> the boxes get the clicks; the Diagram
          overlay is set to pointer-events:none so it no longer swallows them */}
      <Stack interactiveChild="first">
        <Box
          direction="row"
          justify="between"
          pad={{ horizontal: 'xlarge', vertical: 'medium' }}
        >
          <Box gap="medium">
            {coffees.map((brew) => (
              <OptionBox
                key={brew.id}
                id={brew.id}
                label={brew.name}
                active={coffee === brew.id}
                onClick={() => setCoffee(brew.id)}
              />
            ))}
          </Box>
          <Box gap="medium">
            {persons.map((comrade) => (
              <OptionBox
                key={comrade.id}
                id={comrade.id}
                label={comrade.name}
                active={!!coffee && isConnected(coffee, comrade.id)}
                onClick={() => selectPerson(comrade.id)}
              />
            ))}
          </Box>
        </Box>
        {/* Connections for OTHER (non-selected) coffees, in muted grey, so
            it's apparent who is already mapped elsewhere. Rendered first so
            the selected coffee's accent lines sit on top. */}
        <Diagram
          connections={connections
            .filter((c) => c.fromTarget !== coffee)
            .map((c) => ({ ...c, color: OTHER_LINE }))}
        />
        {/* Established lines for the selected coffee, WITHOUT animation, so
            they never redraw when the connection set changes. The line
            currently animating in is excluded here (the animated Diagram
            below owns it) until its draw finishes. */}
        <Diagram
          connections={connections.filter(
            (c) =>
              c.fromTarget === coffee &&
              !(
                drawing &&
                drawing.fromTarget === c.fromTarget &&
                drawing.toTarget === c.toTarget
              ),
          )}
        />
        {/* Only the just-created connection, drawn in via Grommet's "draw"
            animation, then handed back to the static layer above. */}
        {drawing && drawing.fromTarget === coffee && (
          <Diagram
            animation={{ type: 'draw', duration: DRAW_MS }}
            connections={[drawing]}
          />
        )}
      </Stack>

      <BusyButton onOrder={onPlaceOrder} />
      {payee && (
        <Box align="center" pad={{ bottom: 'medium' }}>
          <Text weight="bold">{payee} is buying this round!</Text>
        </Box>
      )}
    </>
  );
}
