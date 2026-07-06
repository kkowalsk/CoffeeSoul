import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Diagram,
  Heading,
  Paragraph,
  RangeInput,
  Stack,
  Text
} from 'grommet';

import NetBalanceView from './NetBalanceView';


// draw-in animation duration (ms) for a newly created connection
export const DRAW_MS = 1000;
// interval (ms) between simulation ticks while "Simulate Orders" is running
const TICK_MS = 500;
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

// Everyone with a default brew who doesn't already have a real connection in
// this order (to ANY coffee -- see the comment on hasConnection below). Used
// both to render the "suggestion" lines/button highlighting here, and by
// App's placeOrder to fill in line items for people never explicitly clicked.
export const unclaimedDefaultConnections = (persons, connections) => {
  const hasConnection = (comradeId) => connections.some((c) => c.toTarget === comradeId);
  return persons
    .filter((comrade) => comrade.defaultBrewId && !hasConnection(comrade.id))
    .map((comrade) => connection(comrade.defaultBrewId, comrade.id));
};

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

// Fisher-Yates -- unlike the common `.sort(() => Math.random() - 0.5)`
// "shuffle", this doesn't bias toward any particular ordering, which matters
// here since shuffle order is what decides the 50/50 split below.
const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// "Randomize" button helper (and the simulation's per-tick logic): assigns
// EVERY person a connection, replacing whatever's currently mapped.
// `randomCount` (0..persons.length, defaulting to half) is how many people --
// by headcount, not just whoever already had a connection -- get a
// different, randomly picked brew (different from whatever they're
// currently connected to, if anything); everyone else goes back to their own
// default brew (dropped entirely if they don't have one -- there's nothing
// to reset to). randomCount === persons.length means everyone gets randomized.
export const randomizeConnections = (
  connections,
  persons,
  coffees,
  randomCount = Math.floor(persons.length / 2),
) => {
  const clampedRandomCount = Math.max(0, Math.min(randomCount, persons.length));
  const shuffled = shuffle(persons);

  const toRandomBrew = shuffled.slice(0, clampedRandomCount).flatMap((person) => {
    const current = connections.find((c) => c.toTarget === person.id)?.fromTarget;
    const alternatives = coffees.filter((brew) => brew.id !== current);
    if (alternatives.length === 0) return [];
    const pick = alternatives[Math.floor(Math.random() * alternatives.length)];
    return [connection(pick.id, person.id)];
  });

  const toDefault = shuffled.slice(clampedRandomCount).flatMap((person) =>
    person.defaultBrewId ? [connection(person.defaultBrewId, person.id)] : [],
  );

  return [...toDefault, ...toRandomBrew];
};

export const BusyButton = ({ onOrder, onResult }) => {
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
          const result = await onOrder?.();
          onResult?.(result ?? null);
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
  onRandomizeConnections,
  onResetHistory,
  onSimulationTick,
  randomCount,
  onRandomCountChange,
  payee,
  lineItems,
  procurements,
}) {
  // A person's default-brew suggestion is only shown until they have a REAL
  // connection in this order (to ANY coffee, not just their default) -- once
  // they do, the suggestion is redundant/stale and must give way to the real
  // one. This one check drives both the button highlighting and the default
  // lines below, so the two can't drift out of sync with each other again.
  const hasConnection = (comradeId) => connections.some((c) => c.toTarget === comradeId);
  const unclaimedDefaults = unclaimedDefaultConnections(persons, connections);
  // The finalized procurement returned by the last successful order, so its
  // total can be shown alongside the payee below.
  const [response, setResponse] = useState(null);

  // "Simulate Orders" toggle: fires onSimulationTick on an interval until
  // toggled off. onSimulationTick is a fresh closure every App render (it
  // closes over `connections`/`persons`/`coffees`), so it's kept in a ref
  // rather than the effect's dependency array -- otherwise the interval
  // would be torn down and restarted on every single tick's re-render,
  // instead of just once when the toggle flips. tickInFlight skips a tick
  // if the previous one (a real network round-trip) hasn't finished yet,
  // so a slow response can't pile up concurrent orders.
  const [simulating, setSimulating] = useState(false);
  const onSimulationTickRef = useRef(onSimulationTick);
  const tickInFlight = useRef(false);
  useEffect(() => {
    onSimulationTickRef.current = onSimulationTick;
  }, [onSimulationTick]);
  useEffect(() => {
    if (!simulating) return undefined;
    const id = setInterval(async () => {
      if (tickInFlight.current) return;
      tickInFlight.current = true;
      try {
        const result = await onSimulationTickRef.current?.();
        setResponse(result ?? null);
      } catch (e) {
        console.error('simulation tick failed', e);
      } finally {
        tickInFlight.current = false;
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [simulating]);

  return (
    <>
      <Heading level={2}>
        Place an Order
      </Heading>
      <Paragraph fill>
        Pick a coffee on the left, then toggle people on the right to connect them.<br></br>Each coffee can map to 0..+ people.
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
            {[...coffees].sort((a, b) => a.price - b.price).map((brew) => (
              <OptionBox
                key={brew.id}
                id={brew.id}
                label={<>{brew.name} <i>${brew.price}</i></>}
                active={coffee === brew.id}
                onClick={() => setCoffee(brew.id)}
              />
            ))}
          </Box>
          <Box gap="medium">
            {persons.map((comrade) => {
              // Matches the "default" Diagram's active-coloring condition
              // below exactly, so the button and its line always agree.
              const isUnclaimedDefaultMatch =
                !!coffee && comrade.defaultBrewId === coffee && !hasConnection(comrade.id);
              return (
                <OptionBox
                  key={comrade.id}
                  id={comrade.id}
                  label={comrade.name}
                  active={(!!coffee && isConnected(coffee, comrade.id)) || isUnclaimedDefaultMatch}
                  onClick={() => selectPerson(comrade.id)}
                />
              );
            })}
          </Box>
        </Box>
        {/* Each person's default brew, as a background reference -- independent
            of the order being built below, but suppressed once they have a real
            connection (see hasConnection above). Muted grey normally; when the
            person's default happens to be the selected coffee, it switches to
            the same active color as a real connection would. Rendered first
            (and split the same way as the order-in-progress connections
            below) so the order's own connections always sit on top. */}
        <Diagram
          connections={unclaimedDefaults
            .filter((c) => c.fromTarget !== coffee)
            .map((c) => ({ ...c, color: OTHER_LINE }))}
        />
        <Diagram
          connections={unclaimedDefaults.filter((c) => c.fromTarget === coffee)}
        />
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

      {/* Controls how many people (out of everyone) "Randomize Connections"
          and each simulation tick assign a random brew to -- the rest go
          back to their own default. Max = everyone randomized. */}
      <Box align="center" pad={{ top: 'medium' }} width="medium">
        <Text size="small">
          Random brews: {randomCount} / {persons.length}
        </Text>
        <RangeInput
          min={0}
          max={persons.length}
          step={1}
          value={randomCount}
          onChange={(e) => onRandomCountChange?.(Number(e.target.value))}
        />
      </Box>
      <Box align="center" pad={{ top: 'medium' }}>
        <Button
          secondary
          label="Randomize Connections"
          onClick={() => onRandomizeConnections?.()}
        />
      </Box>
      <Box align="center" pad={{ top: 'small' }}>
        <Button
          secondary
          color="status-critical"
          label="Reset History"
          onClick={async () => {
            // Irreversible (wipes every past order server-side) -- confirm
            // before firing, same as any destructive action.
            if (!window.confirm('Permanently delete all past orders and restart the round robin? This cannot be undone.')) {
              return;
            }
            try {
              await onResetHistory?.();
            } catch (e) {
              console.error('reset history failed', e);
            }
          }}
        />
      </Box>
      <Box align="center" pad={{ top: 'small' }}>
        <Button
          primary={simulating}
          secondary={!simulating}
          label={simulating ? 'Stop Simulation' : 'Simulate Orders'}
          onClick={() => setSimulating((prev) => !prev)}
        />
      </Box>
      <BusyButton onOrder={onPlaceOrder} onResult={setResponse} />
      {payee && (
        <Box align="center" pad={{ bottom: 'medium' }}>
          <Text weight="bold">{payee} is buying this round!</Text>
          <Text weight="bold">Total: <i>${response?.total}</i></Text>
        </Box>
      )}

      <NetBalanceView persons={persons} coffees={coffees} lineItems={lineItems} procurements={procurements} />
    </>
  );
}
