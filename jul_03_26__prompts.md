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

