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
  Paragraph,
  Text,
  TextArea,
  TextInput,
} from 'grommet';

const emptyBrew = { name: '', price: '', description: '' };

// The "Brews" tab: existing brews in a card grid, with a form at the bottom
// to add a new one. coffees and the create handler are owned by App (same
// pattern as OrderView/PeopleView) -- this stays presentational.
export default function BrewsView({ coffees, onCreateBrew }) {
  const [value, setValue] = useState(emptyBrew);

  const onSubmit = async ({ value: submitted }) => {
    try {
      await onCreateBrew({
        name: submitted.name,
        price: Number(submitted.price),
        // description is optional -- send null rather than an empty string
        description: submitted.description || null,
      });
      setValue(emptyBrew);
    } catch (e) {
      console.error('create brew failed', e);
    }
  };

  return (
    <>
      <Heading level={2}>
        Available Brews
      </Heading>
      <Paragraph fill>
        Set the menu of delectable Brews available for ordering.
      </Paragraph>

      <Box pad="medium" gap="large">
        <Cards data={coffees} size="medium" gap="medium">
          {(brew) => (
            <Card key={brew.id} pad="small" background="white" border round="small">
              <CardBody pad={{ vertical: 'xsmall' }}>
                <Heading level={3} size="small" margin="none">
                  {brew.name} -- ${brew.price}
                </Heading>
              </CardBody>
              <CardFooter
                pad={{ top: 'xsmall' }}
                border={{ side: 'top', color: 'border' }}
                direction="column"
                align="start"
                gap="xxsmall"
              >
                {/* description is nullable -- a brew may not have one */}
                <Text size="small" color="dark-4">
                  {brew.description || 'No description'}
                </Text>
              </CardFooter>
            </Card>
          )}
        </Cards>

        <Box width="medium">
          <Heading level={3} size="small">
            Add a brew
          </Heading>
          <Form value={value} onChange={setValue} onSubmit={onSubmit}>
            <FormField
              label="Name"
              name="name"
              required
              htmlFor="name"
              validate={[{ regexp: /^[a-zA-Z ]+$/ }]}
            >
              <TextInput aria-required id="name" name="name" />
            </FormField>
            <FormField
              label="Price"
              name="price"
              required
              htmlFor="price"
              validate={[{ regexp: /^\d+(\.\d{1,2})?$/, message: 'enter a price like 3.50' }]}
            >
              <TextInput aria-required id="price" name="price" />
            </FormField>
            {/* optional -- may be left blank */}
            <FormField label="Description" name="description" htmlFor="description">
              <TextArea id="description" name="description" />
            </FormField>
            <Box direction="row" justify="end" pad={{ top: 'small' }}>
              <Button type="submit" primary label="Add Brew" />
            </Box>
          </Form>
        </Box>
      </Box>
    </>
  );
}
