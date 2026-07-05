import 
  React,
  { useState } from 'react';
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
  ToggleGroup
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

function App() {
  return (
    <Grommet theme={theme} full>
      <AppBar>
        <Text size="large">Coffee Soul</Text>
      </AppBar>
      <Page pad={{ vertical:'medium' }} kind='narrow' background="background-back">
        <PageContent background="background-front">
          <Box direction="row" justified="between" pad={{ vertical: 'medium' }}>
            <Heading margin="none">
              Title
            </Heading>
          </Box>
          <Paragraph>
            Paragraph
          </Paragraph>
          <Box direction="row">
            <Toggle options={['Coffee1', 'Coffee2', 'Coffee3']} multiple={false} />
          </Box>
          <Box direction="row">
            <Toggle options={['Person1', 'Person2', 'Person3']} />
          </Box>
            
          <BusyButton>

          </BusyButton>
          <Paragraph>

          </Paragraph>
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

export default App;
