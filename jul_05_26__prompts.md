> when declaring a <Toggle> (line 56, App.js), how to override the options.

> ToggleGroup, allow no options to be selected


> Goal: map the Coffee option Toggle element to the Person option Toggle element. draw connections (lines) between the specific toggle option boxes. One coffee option may map to 0..* Person options.
  define re-useable function that is passed to Toggle.onToggle() that creates a new connection or deletes the current one (flips the previous state)


> utilizing the Grommet animated example, render an animation when new connections are created between a coffee and person
  here's the animated example

    > can only new connections be drawn when person selected? i.e. not re-render the existing connections
    > yes, implement caveat fix
    > it's a bit buggy, rollback this change to first version
        > no, keep the first "only animate new connections" code

> when the <BusyButton> element is clicked, note the existing connections (print them to console) then clear all existing connections. this will be utilized to make API calls soon

> time to wire this to the backend:
  1) coffee options should be dynamically created from existing coffees retrieved from API
  2) persons options should be dynamically created from existing coffee_comrades retrieved from API
  3) clicking "place order" busy button should make API calls to submit an Order with LineItems

> ui improvement: render existing Coffee--Person connections for non-selected coffee in a slightly transparent grey so it's apparent what other people have selected for their coffee