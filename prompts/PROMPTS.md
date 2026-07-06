# Prompts

Prompts are categorized into the following categories. For further information open the daily prompt files.

| Category | Count | Explaination of use |
| -- | -- | -- |
| Scripting | 7 | implement scripts for activites such as seed data generation and setup/teardown of environment |
| Docs/Research | 20 | faster search that going directly to search engine |
| Architecture | 11 | research into selection of frameworks/tools as well as standard patterns for implementation |
| Code generation (backend) | 13 | handle repeative implementation activites. e.g.<br>* API stubbing across controllers<br>* re-implementation of logic from python into java |
| Debugging (backend) | 1 | rollback claude's destructive behaviour of postgres container following a separate prompt |
| Code generation (frontend) | 47 | bridge my knowledge gap for faster iteration of UI features in new framework |
| Debugging (frontend) | 6 | faster iteration of UI features in new framework  |
| Refactoring | 10 | improved handling of naming changes and code extract into separate files |
| Deployment | 33 | expanding poc script into docker compose setup<br>locate difficult search results related to AWS configuration as well as ability to check against my live AWS environment |

**Total prompts classified: 148** (across `jun_30_26` through `jul_06_26`)

Counting method: a prompt is any line starting with `>`. Nested or indented lines indicate a sub-prompt relating to the parent prompt context, including answers to Claude's own clarifying questions, e.g. "Gradle" or "Group under stack/ (Recommended)"). Plain bullets, tables, code blocks, and unindented context lines under a `>` are content belonging to that prompt, not separate ones.

Three lines are shorthand for a batch instead of transcribing each prompt, and are counted at their stated number rather than as one line:
- `jul_01`: "~10 additional random python documentation-related prompts" -> 10x Docs/Research
- `jul_05`: "~20 extra prompts to tweak UI behaviour" -> 20x Code generation (frontend)
- `jul_06`: "~20 additional back and forth prompts" (the EC2/ECR/IAM/Infisical/TLS/cron deployment thread) -> 20x Deployment

**Scripting** covers one-off data/test scripts rather than application code: seed data JSON generation (`jun_30`), the `orders_variable.json`/`orders_repeatative.json` bulk-data expansions (`jul_01`), and the curl+jq order-processing script (`jul_03`).

## Example prompts per category

**Scripting**
- "Given these SQL relationships, generate seed data ... generate this in three separate json files" (`jun_30`)
- "override the orders_repeatative.json file so that it contains 1000 copies of the following json in a list" (`jul_01`)
- "following the example set in poc/source/poc.python, generate curl commands and serialize to file for setting up and processing 10 orders" (`jul_03`)

**Docs/Research**
- "postgresql connection via java or python" (`jul_01`)
- "python sorted collection based on specific field in the class. sorted upon insert?" (`jul_01`)
- "application.yaml vs application.properties" (`jul_03`)

**Architecture**
- "java. off the shelf credentials management in containerized microservice environment ... is HashiCorp Vault or Infisical free for use for small deployments?" (`jul_01`)
- "lets do a architectural and code review of this project" (`jul_02`)
- "what's a better pattern for applying the schema to the db on startup if does not exist?" (`jul_03`)

**Code generation (backend)**
- "add a dataconnection to poc.py with secrets injection/lookup from infisical" (`jul_03`)
- "add REST APIs for POST/PUT/GET/DELETE for the following domain objects: ..." (`jul_03`)
- "the API and web page are connected. time to implement the WeightedRoundRobin logic found in poc.py. see sequence diagram outlined in weighted_round_robin.puml. ask clarifying questions" (`jul_05`)

**Debugging (backend)**
- "thanks for deleting my infisical/.env file. since the encryption key and auth secret are lost now, infisical needs to be regenerated. commands to clean previous inaccessible infisical and generate first time setup." (`jul_02`)

**Code generation (frontend)**
- "Goal: map the Coffee option Toggle element to the Person option Toggle element. draw connections (lines) between the specific toggle option boxes. One coffee option may map to 0..* Person options." (`jul_05`)
- "time to wire this to the backend: 1) coffee options should be dynamically created from existing coffees retrieved from API ..." (`jul_05`)
- "using the stubbed out PeopleView.js, render existing people in card layout and add \"create new person\" form at bottom" (`jul_05`)

**Debugging (frontend)**
- "when i click the \"BusyButton\" this error is thrown" (`jul_04`)
- "when declaring a <Toggle> (line 56, App.js), how to override the options." (`jul_05`)
- "the connections in the ordering view needs to be re-designed. there are a number of bugs: ..." (`jul_05`)

**Refactoring**
- "refactor \"Order\" to \"Procurement\" across python, puml, and sql" (`jul_02`)
- "extract businesslogic from Controllers to Services in API" (`jul_05`)
- "refactor App.js to extract the 4 tabs into views stored in separate files" (`jul_05`)

**Deployment**
- "docker. create simple docker setup to support this proof of concept. generate \"create table schemas\" scripts based off of the puml and python classes" (`jul_02`)
- "add infisical container to project. git mv python source into subdirectory and create ./poc level compose that includes each subdirectory (source, db, ...)" (`jul_02`)
- "instructions for how to deploy this project to EC2 instance." (`jul_06`)