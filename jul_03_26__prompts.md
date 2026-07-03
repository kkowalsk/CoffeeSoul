> add a dataconnection to poc.py with secrets injection/lookup from infisical
    > remove infiscial sdk from poc
    > python psycopg2 and psycopg3

> keep poc.py as-is but we're going to duplicate and create 2 new sub directories: 1) microservice 2) database seeding
  1) separate into different directories
  2) add containers to compose (remove poc.py from compose)
  3) drop table and replace comrades and brews on start. do not process procurements file
  4) microservice logic will be lines 212 onwards

> update service so db records are added during processing

> set postgres timezone to be MDT

feature branch swithc
> lets refactor the microservice container to a java springboot backend. ask questions if need be    
    > Should the Spring Boot service keep the same one-shot batch behavior (runs the round-robin over orders_mixed.json on startup, writes to db, exits), or become a real long-running REST API (e.g. endpoints to submit orders / trigger processing / query results)?
        → the next steps are refactoring it to a REST API  but for now, keep the logic but do nothing on startup
    > Maven or Gradle for the build?
        → Gradle
    > Which Java version / Spring Boot version?
        → Java 21 + Spring Boot 3.3.x (Recommended)

> add REST APIs for POST/PUT/GET/DELETE for the following domain objects:
| - | POST | PUT | GET | DELETE | notes |
| - | - | - | - | - | - |
| brew | x | x | x | x | name/price required, desc optional |
| coffeecomrade | x | x | x | x | name required, defaultbrew optional | 
| lineitem | x | x | x | x | comrade, brew required |
| procurement | x | x | x | x | timestamp updataeble. lineitems added via separate request |

skip smoothweightedroundrobin 

> extract url and versioning properties to application.properties file

> application.yaml vs application.properties

> following the example set in poc/source/poc.python, generate curl commands and serialize to file for setting up and processing 10 orders
    > refactor to jq

> what's a better pattern for applying the schema to the db on startup if does not exist?
    > yes wire up the embedded-Flyway version

> git mv the following folders and supplemental files out of /poc.
  database-seeding
  db
  infisical
  microservice

  all that should be left in /poc is /source and other required files to run $python poc.py in localhost. strip poc.py of database connection code - it should only create in-memory objects

  open to suggestions of how to structure it at repo top level

    > · How should the moved containerized stack (db, database-seeding, microservice, infisical + docker-compose.yml + the .sh scripts) be arranged at the repo top level? → Group under stack/ (Recommended)
    2> poc/source/ still has container files for the old Python app (Dockerfile, docker-compose.yml, .env.example) that predate the Java microservice. Since poc/ is becoming local-only (python poc.py), what should happen to them? → Remove them (Recommended)

> if adding a ui to the stack folder, what is the naming convention? /frontend ?
    > explain CORS decision further
    > also, this will be deployed to the web eventually
    > yes, scafford the frontend/ folder (which is actually the newly created web/ folder) and rename the microservce/ folder to api/
    > rename the java packages