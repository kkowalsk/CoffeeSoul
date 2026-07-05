import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  Cards,
  Form,
  FormField,
  Heading,
  Select,
  Text,
  TextInput,
} from 'grommet';

const emptyPerson = { name: '', defaultBrewId: undefined };

// The "People" tab: existing coffee comrades in a card grid, with a form at
// the bottom to add a new one. persons/coffees and the create handler are
// owned by App (same pattern as OrderView) -- this stays presentational.
export default function PeopleView({ persons, coffees, onCreatePerson }) {
  const [value, setValue] = useState(emptyPerson);
  // Whether the brew Select is showing -- toggled on by the Plus icon.
  // Once a brew is picked this is moot (the "has a default" branch takes
  // over); clearing via the Minus icon collapses back to the Plus icon.
  const [pickingDefaultBrew, setPickingDefaultBrew] = useState(false);
  // Controls the Select's dropdown so clicking Plus opens it immediately,
  // instead of just revealing a closed Select the user has to click again.
  const [brewSelectOpen, setBrewSelectOpen] = useState(false);

  // defaultBrewId is nullable -- a comrade may not have a default brew yet.
  const brewName = (defaultBrewId) =>
    coffees.find((brew) => brew.id === defaultBrewId)?.name ?? 'No default';

  const clearDefaultBrew = () => {
    setValue((prev) => ({ ...prev, defaultBrewId: undefined }));
    setPickingDefaultBrew(false);
    setBrewSelectOpen(false);
  };

  const onSubmit = async ({ value: submitted }) => {
    try {
      await onCreatePerson({
        name: submitted.name,
        defaultBrewId: submitted.defaultBrewId ?? null,
      });
      setValue(emptyPerson);
      setPickingDefaultBrew(false);
      setBrewSelectOpen(false);
    } catch (e) {
      console.error('create person failed', e);
    }
  };

  return (
    <Box pad="medium" gap="large">
      <Cards data={persons} size="medium" gap="medium">
        {(person) => (
          <Card key={person.id} pad="small" background="white" border round="small">
            <CardBody pad={{ vertical: 'xsmall' }}>
              <Heading level={3} size="small" margin="none">
                {person.name}
              </Heading>
            </CardBody>
            <CardFooter pad={{ top: 'xsmall' }} border={{ side: 'top', color: 'border' }}>
              <Text size="small" color="dark-4">
                {brewName(person.defaultBrewId)}
              </Text>
            </CardFooter>
          </Card>
        )}
      </Cards>

      <Box width="medium">
        <Heading level={3} size="small">
          Add a person
        </Heading>
        <Form value={value} onChange={setValue} onSubmit={onSubmit}>
          <FormField
            label="Name"
            name="name"
            required
            htmlFor="name"
            validate={[{ regexp: /^[a-zA-Z]+$/ }]}
          >
            <TextInput aria-required id="name" name="name" />
          </FormField>
          {/* optional -- Plus reveals the brew picker, Minus clears it back
              to no default. */}
          <FormField label="Default Brew" name="defaultBrewId" htmlFor="defaultBrewId">
            {value.defaultBrewId ? (
              <Box direction="row" align="center" justify="between" pad={{ vertical: 'xsmall' }}>
                <Text>{brewName(value.defaultBrewId)}</Text>
                <Button
                  plain
                  a11yTitle="Remove default brew"
                  icon={<img src="/minus2.png" alt="" width={36} height={36} />}
                  onClick={clearDefaultBrew}
                />
              </Box>
            ) : pickingDefaultBrew ? (
              <Select
                id="defaultBrewId"
                name="defaultBrewId"
                placeholder="Select a brew"
                options={coffees}
                labelKey="name"
                valueKey={{ key: 'id', reduce: true }}
                open={brewSelectOpen}
                onOpen={() => setBrewSelectOpen(true)}
                onClose={() => setBrewSelectOpen(false)}
              />
            ) : (
              <Box pad={{ vertical: 'xsmall' }}>
                <Button
                  plain
                  a11yTitle="Add default brew"
                  label=""
                  icon={<img src="/plus.png" alt="" width={36} height={36} />}
                  onClick={() => {
                    setPickingDefaultBrew(true);
                    setBrewSelectOpen(true);
                  }}
                />
              </Box>
            )}
          </FormField>
          <Box direction="row" justify="end" pad={{ top: 'small' }}>
            <Button
              type="submit"
              primary
              label="Add Person"
            />
          </Box>
        </Form>
      </Box>
    </Box>
  );
}
