## Metadata

date: July-01-26

hours 
* 03:30 - 4:30

## research

[weighted round wikipedia overview](https://en.wikipedia.org/wiki/Weighted_round_robin)
[blog post on WRR](https://oneuptime.com/blog/post/2026-01-30-weighted-round-robin/view)

### reflections

weighted round robin is the correct "ideal" algorithm *if*:
1) the drink ordered never changes
2) the group is static and everyone is always present

#### Drink changes

May be possibly handled by caculating the live total and subtracting it when selected. 

Needs to be verified with "performance" (high throughput) testing.

Ideally, serialize this data to a database for easier retrieval - raises priority of metric analysis following targeted daily goal of  containerization and persistence (db serialization). 

#### Group Changes

OneUpTime blog suggested this may be adjusted by resetting weights. I wonder if this should happen immediately following group changes, or be somewhat lagged.

Could partial weight be carried forward, but halved/quartered?

Various *carryoverWeightPercentage* could be simulated with across different high throughput testcases and tuned. But likely depends on how often group changes occur as well.  