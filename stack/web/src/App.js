import
  React,
  { useState, useReducer, useEffect } from 'react';
import { 
  Box,
  Button,
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

const COFFEES = ['Coffee1', 'Coffee2', 'Coffee3'];
const PERSONS = ['Person1', 'Person2', 'Person3'];

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
  // Each connection is a { fromTarget: coffeeId, toTarget: personId } pair.
  const [connections, setConnections] = useState([]);
  // The coffee currently being edited (the "from" side).
  const [coffee, setCoffee] = useState();
  const flip = flipConnection(setConnections);

  const isConnected = (coffeeId, personId) =>
    connections.some((c) => c.fromTarget === coffeeId && c.toTarget === personId);

  return (
    <Grommet theme={theme} full>
      <AppBar>
        <Text size="large">Coffee Soul</Text>
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
                {COFFEES.map((c) => (
                  <OptionBox
                    key={c}
                    id={c}
                    label={c}
                    active={coffee === c}
                    onClick={() => setCoffee(c)}
                  />
                ))}
              </Box>
              <Box gap="medium">
                {PERSONS.map((p) => (
                  <OptionBox
                    key={p}
                    id={p}
                    label={p}
                    active={!!coffee && isConnected(coffee, p)}
                    onClick={() => coffee && flip(coffee, p)}
                  />
                ))}
              </Box>
            </Box>
            {/* only draw lines for the selected coffee; the full `connections`
                data is preserved, so switching back re-renders its lines */}
            <Diagram connections={connections.filter((c) => c.fromTarget === coffee)} />
          </Stack>

          <BusyButton />
        </PageContent>
      </Page>
    </Grommet>
  );
}

export const BusyButton = () => {
  const [busy, setBusy] = useState();
  const [success, setSuccess] = useState();

  return (
    <Box align="center" pad="medium">
    <Button 
      primary
      busy={busy} 
      success={success}
      label="Place Order"
      onClick={() => {
        setBusy(true);
        setTimeout(() => {
          setBusy(false);
          setSuccess(true);
        }, 2000);
        setTimeout(() => {
          setSuccess(false);
        }, 4000);
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
