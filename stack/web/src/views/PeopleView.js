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

  // defaultBrewId is nullable -- a comrade may not have a default brew yet.
  const brewName = (defaultBrewId) =>
    coffees.find((brew) => brew.id === defaultBrewId)?.name ?? 'No default';

  const onSubmit = async ({ value: submitted }) => {
    try {
      await onCreatePerson({
        name: submitted.name,
        defaultBrewId: submitted.defaultBrewId ?? null,
      });
      setValue(emptyPerson);
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
          {/* optional -- "clear" lets you go back to no default after picking one */}
          <FormField label="Default Brew" name="defaultBrewId" htmlFor="defaultBrewId">
            <Select
              id="defaultBrewId"
              name="defaultBrewId"
              placeholder="No default"
              options={coffees}
              labelKey="name"
              valueKey={{ key: 'id', reduce: true }}
              clear={{ label: 'No default' }}
            />
          </FormField>
          <Box direction="row" justify="end" pad={{ top: 'small' }}>
            <Button
              type="submit"
              primary
              label="Add Person"
              icon={<img src="/plus.png" alt="" width={18} height={18} />}
            />
          </Box>
        </Form>
      </Box>
    </Box>
  );
}
