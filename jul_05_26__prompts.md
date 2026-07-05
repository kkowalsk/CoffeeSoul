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

> extract businesslogic from Controllers to Services in API

> using LoggerFactory, add logging for ever request in Services

> the API and web page are connected. time to implement the WeightedRoundRobin logic found in poc.py. see sequence diagram outlined in weighted_round_robin.puml. ask clarifying questions
    >  User answered Claude's questions:
        · The sequence diagram's startup section only loads/creates a single round-robin UUID row — it doesn't replay historical procurements. Should comrade weight totals live purely in memory (reset to zero every time the API restarts), or should the service rebuild weights from all past finalized procurements at startup? → Rebuild from DB history at startup
        · The diagram shows 'web -> pc: finalize order' as an explicit step after all line items are created. How far should this task go on the frontend? → Full end-to-end (Recommended)
        · What should happen if finalize is called on a procurement that already has a payee set (e.g. duplicate request, or retry)? → Reject with a conflict (Recommended)


> update icon to be coffee-cup.png and attribute in a footer using this

  <a href="https://www.flaticon.com/free-icons/coffee" title="coffee icons">Coffee icons created by Freepik - Flaticon</a>

>  Map icons to Tab icons in App.js
  0) order = online-order.png
  1) people = people.png
  2) drinks = coffee-cup.png
  3) metrics = benchmarking.png


> refactor App.js to extract the 4 tabs into views stored in separate files

> using the stubbed out PeopleView.js, render existing people in card layout and add "create new person" form at bottom
  1) re-use loaded people/brew data from App.js (i.e. pass into creation of view)
  2) default brew may be null
  3) stubbing utilized storybook from https://storybook.grommet.io/
  4) icons added under public/

>  lets rethink DefaultBrew. Instead of rendering the dropdown, the user must first click a Plus icon which then allows selection of brew. a Minus icon removes the selected default brew
    > getting closer, is there a way to open up the dropdown when the click is clicked so it saves the user a click

> when the order page is loaded, iterate over the Persons array and create grey'ed connections between their default brews in the coffee buttons and their person buttons. when a coffee button is selected, re-render its connections with active/colored connection


> using the stubbed out BrewsView.js, render existing brews in card layout and add "create new brew" form at bottom
  1) re-use loaded brew data from App.js (i.e. pass into creation of view)
  2) description may be null | empty
  3) stubbing utilized storybook from https://storybook.grommet.io/
  4) icons added under public/