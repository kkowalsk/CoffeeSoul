> when declaring a <Toggle> (line 56, App.js), how to override the options.

> ToggleGroup, allow no options to be selected


> Goal: map the Coffee option Toggle element to the Person option Toggle element. draw connections (lines) between the specific toggle option boxes. One coffee option may map to 0..* Person options.
  define re-useable function that is passed to Toggle.onToggle() that creates a new connection or deletes the current one (flips the previous state)