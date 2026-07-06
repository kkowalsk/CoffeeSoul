import
  React,
  { useState, useReducer, useEffect } from 'react';
import {
  Box,
  Footer,
  Grommet,
  Header,
  Heading,
  Page,
  PageContent,
  Tab,
  Tabs,
  Text,
  ToggleGroup,
} from 'grommet';
import OrderView, {
  DRAW_MS,
  connection,
  flipConnection,
  randomizeConnections,
  unclaimedDefaultConnections,
} from './views/OrderView';
import PeopleView from './views/PeopleView';
import BrewsView from './views/BrewsView';
import HistoryView from './views/HistoryView';
import MetricsView from './views/MetricsView';

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

async function deleteRequest(path) {
  const res = await fetch(`${API}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${path} -> ${res.status}`);
}

// tab icon pixel size, shared so the four <img> icons + the theme's tab-row
// gap/padding stay proportional if this changes.
const TAB_ICON_SIZE = 56;

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
  // Tab/Tabs have no size prop -- this is the only way to make the tab row
  // (icon-to-text gap + hit-area padding) bigger.
  tab: {
    gap: 'medium',
    pad: { horizontal: 'small', vertical: 'small' },
    margin: { vertical: 'xsmall', horizontal: 'medium' },
    // Tab.js only applies this background when active -- inactive tabs stay
    // on theme.tab.background (unset/transparent).
    active: {
      background: 'light-4',
    },
  },
  // Grommet's default FormField insets its label by a 'small' horizontal
  // margin but not the input/select below it, so a plain TextInput/Select
  // renders flush-left while its label sits 12px in -- misaligning every
  // form in the app. Zero it so the label sits directly above its field.
  formField: {
    label: {
      margin: { horizontal: 'none' },
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
  // Past procurements and their line items, for the History tab.
  const [procurements, setProcurements] = useState([]);
  const [lineItems, setLineItems] = useState([]);
  // How many people (out of all persons) get a random brew vs. their default,
  // on both "Randomize Connections" and each simulation tick. null until the
  // user touches the slider, so it tracks persons.length (half) as comrades
  // load in/get added, rather than freezing at 0 from the initial empty list.
  const [randomCount, setRandomCount] = useState(null);
  const effectiveRandomCount = randomCount ?? Math.floor(persons.length / 2);
  const flip = flipConnection(setConnections);

  useEffect(() => {
    getJson('/brews').then(setCoffees).catch((e) => console.error('load brews', e));
    getJson('/coffee-comrades')
      .then(setPersons)
      .catch((e) => console.error('load comrades', e));
    getJson('/procurements')
      .then(setProcurements)
      .catch((e) => console.error('load procurements', e));
    getJson('/line-items')
      .then(setLineItems)
      .catch((e) => console.error('load line items', e));
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

  // "Randomize Connections" button: reassigns everyone, effectiveRandomCount
  // of them (by headcount) to a different, randomly picked brew and the rest
  // back to their own default brew. See randomizeConnections in OrderView.
  const randomizeConnectionsNow = () =>
    setConnections((prev) => randomizeConnections(prev, persons, coffees, effectiveRandomCount));

  // Shared by "Place Order" and the simulation below: create an Order
  // (procurement), then a LineItem for every explicit connection PLUS every
  // person who never got clicked this round (they get their default brew),
  // then finalize it so the weighted round robin picks a payee. Takes the
  // connections to order explicitly (rather than always reading `connections`
  // state) so the simulation can pass its own just-randomized set without
  // waiting on a state update to land first.
  const placeOrderWith = async (activeConnections) => {
    const orderConnections = [...activeConnections, ...unclaimedDefaultConnections(persons, activeConnections)];
    if (orderConnections.length === 0) return null;
    console.log('placing order for connections:', orderConnections);
    setPayee(null);
    const order = await postJson('/procurements', {});
    const newLineItems = await Promise.all(
      orderConnections.map((c) =>
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
    // Append rather than refetch, so the History tab reflects this order
    // immediately instead of showing a stale snapshot from page load.
    setProcurements((prev) => [...prev, finalized]);
    setLineItems((prev) => [...prev, ...newLineItems]);
    return finalized;
  };

  const placeOrder = () => placeOrderWith(connections);

  // "Simulate Orders" toggle: randomizes connections, then places an order
  // with that EXACT randomized set -- not the `connections` state, which
  // wouldn't have re-rendered yet if we called onRandomizeConnections and
  // onPlaceOrder back to back. Reuses placeOrderWith directly (the same
  // order-placing codepath as the real button) but skips BusyButton's
  // busy/success UI and its 2s reset timer, which would fight a fast cadence.
  const runSimulationTick = async () => {
    const randomized = randomizeConnections(connections, persons, coffees, effectiveRandomCount);
    setConnections(randomized);
    return placeOrderWith(randomized);
  };

  // "Reset History": deletes every procurement/line item server-side (brews
  // and comrades are untouched) and restarts the weighted round robin, then
  // clears the equivalent client-side state to match.
  const resetHistory = async () => {
    await deleteRequest('/procurements');
    setProcurements([]);
    setLineItems([]);
    setConnections([]);
    setPayee(null);
    setDrawing(null);
  };

  // Add a new coffee comrade, then append it to the loaded list so the
  // People tab's card grid picks it up without a refetch.
  const createPerson = async ({ name, defaultBrewId }) => {
    const created = await postJson('/coffee-comrades', { name, defaultBrewId });
    setPersons((prev) => [...prev, created]);
  };

  // Add a new brew, then append it to the loaded list so the Brews tab's
  // card grid (and the Order tab's coffee list) picks it up without a refetch.
  const createBrew = async ({ name, price, description }) => {
    const created = await postJson('/brews', { name, price, description });
    setCoffees((prev) => [...prev, created]);
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
          {/* <Box direction="row" justify="between" pad={{ vertical: 'medium' }}>
            <Heading margin="none">
              Title
            </Heading>
          </Box> */}

          <Tabs>
            <Tab
              // title={<Text size="large">Order</Text>}
              icon={<img src="/online-order.png" alt="" width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} />}
            >
              <OrderView
                coffees={coffees}
                persons={persons}
                coffee={coffee}
                setCoffee={setCoffee}
                connections={connections}
                drawing={drawing}
                isConnected={isConnected}
                selectPerson={selectPerson}
                onPlaceOrder={placeOrder}
                onRandomizeConnections={randomizeConnectionsNow}
                onResetHistory={resetHistory}
                onSimulationTick={runSimulationTick}
                randomCount={effectiveRandomCount}
                onRandomCountChange={setRandomCount}
                payee={payee}
                lineItems={lineItems}
                procurements={procurements}
              />
            </Tab>
            <Tab
              // title={<Text size="large">People</Text>}
              icon={<img src="/people.png" alt="" width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} />}
            >
              <PeopleView persons={persons} coffees={coffees} onCreatePerson={createPerson} />
            </Tab>
            <Tab
              // title={<Text size="large">Brews</Text>}
              icon={<img src="/coffee-cup.png" alt="" width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} />}
            >
              <BrewsView coffees={coffees} onCreateBrew={createBrew} />
            </Tab>
            <Tab
              // title={<Text size="large">History</Text>}
              icon={<img src="/clipboard.png" alt="" width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} />}
            >
              <HistoryView
                procurements={procurements}
                persons={persons}
                coffees={coffees}
                lineItems={lineItems}
              />
            </Tab>
            <Tab
              // title={<Text size="large">Metrics</Text>}
              icon={<img src="/benchmarking.png" alt="" width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} />}
            >
              <MetricsView
                persons={persons}
                coffees={coffees}
                lineItems={lineItems}
                procurements={procurements}
              />
            </Tab>
          </Tabs>
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
