## Metadata

playlist: "This is Solas"

date: Jun-30-26

hours 
* 11:15 - 11:45 
* 14:00 - 



## algorithm
* round robin based on drink cost %
    * simple if everyone is always present and no group changes are made

* people may join/leave the group which will have to be accounted at session
    * at what number should a new group be initialized, 50% don't have shared history?
    * is there a way to account for past group history and weight it in the new group going forward? a sliding window?

## implementations
0) PoC
- configure initial people
- they are always there
- easily calculate # of times required to pay before round restarts
- single session support only 

0) not present 
- need to account for people not being there
- considered if present for X% of recent visits
- multi session

0) adding new people
- keep most recent history to factor in legacy purchases


## deployments
0) PoC
    - data not persisted, all in-mem
    - cli

0) container-ized, web server. 

0) data persisted in database (sql)

0) website frontend replaces CLI

0) cloud hosted

0) multi-user + group sessions

0) android app 


## tech stack
- go would make sense, but not very experienced in it 
- java or python backend would be fine
- javascript framework for gui. react + grommet


## UX

settings 
* changing a default drink should preserve history of money paid in 
* defining coffee drinks without drinker
* add [Coffee Goer] [Coffee Drinker] [Attendee]

check in session / pay for session


## areas
* algorithm / math
* UI / UX
* multi-tenant / sessions
* deployment 
* persistence 

## metrics
* badges for variuos stats
  - most times paid 
  - most paid for one offs
* lifetime paid
* lifetime paid for
* last time paid
* history of dates

### Mom's idea
* easter egg or something fun like "you won a cookie!"

## terminology
* current tab
* abstract drink/beverage/consumable (lol) for inclusiveness 
* juant / outing / junket

## stretch ideas
* daily banner greeting the user with a friendly/silly phrase like "today's jaunt across the street for a sweet drink" 
  * could use AI to generate silly phrases, even if they are hardcoded and not live 

# Schedule
| date | goal | achieved | hours |
| - | - | - | - |
| 06/30/2026 | planning <br> code kick off | | |
| 07/01/2026 | PoC completed <br> containerized <br> persistence | | |
| 07/02/2026 | UI PoC <br> cloud hosted | | |
| 07/03/2026 | group changes <br> multi-user | | |
| 07/04/2026 | day off | | |
| 07/05/2026 | metrics <br> android | | |
| 07/06/2026 | share it 🚀 | | |