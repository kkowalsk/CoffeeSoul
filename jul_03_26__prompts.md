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