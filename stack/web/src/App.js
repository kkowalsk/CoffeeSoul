import
  React,
  { useState, useReducer, useEffect } from 'react';
import {
  Box,
  Button,
  Footer,
  Grommet,
  Header,
  Heading,
  Page,
  PageContent,
  Paragraph,
  Text,
  ToggleGroup,
  Diagram,
  Stack
} from 'grommet';

// --- backend API ---
// Relative URLs: in prod the web nginx proxies /api to the api service; in dev
// the CRA "proxy" field in package.json forwards /api to the api container.
const API = '/api/v1';

async function getJson(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

async function postJson(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return res.json();
}

const theme = {
  global: {
    colors: {
      brand: '#6B4423',
    },
    font: {
      family: "Roboto",
      size: "18px",
      height: "20px",
    },
  },
};

const AppBar = (props) => (
  <Header
    background="brand"
    pad={{ left: "medium", right: "small", vertical: "small" }}
    elevation="medium"
    {...props}
  />
);

// draw-in animation duration (ms) for a newly created connection
const DRAW_MS = 1000;
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

function App() {
  // Coffees (brews) and people (coffee_comrades), loaded from the API on mount.
  const [coffees, setCoffees] = useState([]);
  const [persons, setPersons] = useState([]);
  // Each connection is a { fromTarget: brewId, toTarget: comradeId } pair.
  const [connections, setConnections] = useState([]);
  // The coffee currently being edited (the "from" side).
  const [coffee, setCoffee] = useState();
  // The single connection currently animating in; cleared once its draw
  // finishes so it hands off to the static (non-animating) layer.
  const [drawing, setDrawing] = useState(null);
  // Name of whoever the weighted round robin picked to pay for the most
  // recently finalized order; cleared when a new order starts.
  const [payee, setPayee] = useState(null);
  const flip = flipConnection(setConnections);

  useEffect(() => {
    getJson('/brews').then(setCoffees).catch((e) => console.error('load brews', e));
    getJson('/coffee-comrades')
      .then(setPersons)
      .catch((e) => console.error('load comrades', e));
  }, []);

  const isConnected = (coffeeId, personId) =>
    connections.some((c) => c.fromTarget === coffeeId && c.toTarget === personId);

  // Map/unmap a person to the selected coffee. On CREATE only, flag the new
  // connection as "drawing" for DRAW_MS so ONLY it animates in -- established
  // lines (rendered by the static Diagram) are left untouched.
  const selectPerson = (personId) => {
    if (!coffee) return;
    const removing = isConnected(coffee, personId);
    flip(coffee, personId);
    if (!removing) {
      setDrawing(connection(coffee, personId));
      setTimeout(() => setDrawing(null), DRAW_MS);
    }
  };

  // "Place Order": create an Order (procurement), then a LineItem per connection
  // (coffee = brew = fromTarget, person = comrade = toTarget), then finalize it
  // so the weighted round robin picks a payee.
  const placeOrder = async () => {
    if (connections.length === 0) return;
    console.log('placing order for connections:', connections);
    setPayee(null);
    const order = await postJson('/procurements', {});
    await Promise.all(
      connections.map((c) =>
        postJson('/line-items', {
          procurementId: order.id,
          brewId: c.fromTarget,
          comradeId: c.toTarget,
        }),
      ),
    );
    const finalized = await postJson(`/procurements/${order.id}/finalize`, {});
    console.log('order placed:', order.id, 'payee:', finalized.payeeId);
    setPayee(persons.find((p) => p.id === finalized.payeeId)?.name ?? null);
    setConnections([]);
  };

  return (
    <Grommet theme={theme} full>
      <AppBar>
        <Box direction="row" align="center" gap="small">
          <img src="/coffee-cup.png" alt="" width="28" height="28" />
          <Text size="large">Coffee Soul</Text>
        </Box>
      </AppBar>
      <Page pad={{ vertical: 'medium' }} kind='narrow' background="background-back">
        <PageContent background="background-front">
          <Box direction="row" justify="between" pad={{ vertical: 'medium' }}>
            <Heading margin="none">
              Title
            </Heading>
          </Box>
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

          <BusyButton onOrder={placeOrder} />
          {payee && (
            <Box align="center" pad={{ bottom: 'medium' }}>
              <Text weight="bold">{payee} is buying this round!</Text>
            </Box>
          )}
        </PageContent>
      </Page>
      <Footer background="background-back" pad="small" justify="center">
        <Text size="xsmall">
          <a href="https://www.flaticon.com/free-icons/coffee" title="coffee icons">
            Coffee icons created by Freepik - Flaticon
          </a>
        </Text>
      </Footer>
    </Grommet>
  );
}

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

export const Toggle = ({ options = ['1', '2', '3'], ...rest }) => {
  const [value, setValue] = useState([]);

  return (
    <Box direction="row" gap="xlarge" overflow="auto"> 
      <Box gap="large" pad="large">
        <ToggleGroup
          options={options}
          value={value}
          onToggle={(e) => setValue(e.value)}
          multiple
          {...rest}
        />
      </Box>
    </Box>
  )
}

const connection = (fromTarget, toTarget, {...rest} = {}) => ({
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
const flipConnection = (setConnections) => (fromTarget, toTarget) =>
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

export const AnimatedConnection = () => {
  const reducer = (draw) => !draw;

  const [draw, toggleDraw] = useReducer(reducer, true);

  useEffect(() => {
    const timer = setInterval(() => {
      toggleDraw();
    }, 2000);
      return () => clearInterval(timer);
  }, [toggleDraw]);

  const connections=[];

}

export default App;
