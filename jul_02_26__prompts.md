>docker. create simple docker setup to support this proof of concept. generate "create table schemas" scripts based off of the puml and python classes2
>separate the sql container from the poc
>refactor "Order" to "Procurement" across python, puml, and sql
>add infisical container to project. git mv python source into subdirectory and create ./poc level compose that includes each subdirectory (source, db, ...)
  > What kind of Infisical setup do you want added to the project? → Self-hosted Infisical platform (Recommended)
  > ive configured a infisical project 'CoffeeSoul_Local' with 2 secrets 'POSTGRES_USER' and 'POSTGRES_PASSWORD'. how to start up postgres
  container
  > this command: infisical run --env=dev --path=/ -- docker compose up -d db
    how to use it with 'docker compose up' at poc/ dir level
  > docker compose, how to configure compose files/containers to wait until dependencies are initialized/running
    > how to startup in /poc dir
    > infisical run .... isn't needed now?
    > so whats the cmd to run from /poc
    > thanks for deleting my infisical/.env file. since the encryption key and auth secret are lost now, infisical needs to be regenerated. commands to clean previous inaccessible infisical and generate first time setup. unless that's retrievable in the UI?