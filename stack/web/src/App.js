import { Grommet, Header, Text } from 'grommet';

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

function App() {
  return (
    <Grommet theme={theme} full>
      <AppBar>
        <Text size="large">Coffee Soul</Text>
      </AppBar>
    </Grommet>
  );
}

export default App;
