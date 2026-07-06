# Coffee Soul

## Overview 

This coding challenge was to solve a classic scheduling problem - whose turn is it to pay for coffee?

A group of coworkers regularly go out to coffee together. To make the barista's life a bit easier, they take turns paying paying for everyone's drinks on one order. 

This application's structure is as follows:

```text
coffee_soul/
├── poc/              # original Python CLI proof-of-concept
│   └── source/
│
└── stack/            # deployed system (Docker Compose)
    ├── db/           # postgres
    ├── db-seeding/   # one-shot reference data seeder
    ├── api/          # Spring Boot REST API
    ├── web/          # React SPA + nginx (TLS)
    └── infisical/    # self-hosted secrets manager
```

## Assumptions

To simplify the problem space, the following assumptions were made:
1) the goal is to aim for each person to overall spend about what they would've paid if only purchasing their own line items
1) once a person is added to the group, they must order a coffee each time
1) a person must have a default drink, but is allowed to change what drink they order

## Development Approach

Here are the high-level steps I followed for this deliverable. 

#### Inception
0) Considered the problem space - realized this was a scheduling problem
0) Developed (by hand) a proof of concept using the Smooth Weighted Round Robin
0) Generated and verified algorithm against multiple datasets

#### Maturation
3) Created containerized setup (docker compose)
0) Added secrets management and persisted storage 
0) Re-implemented backend behaviour and exposed through API 
0) Iterated on UI implementation

#### Release
7) Deployed to AWS

## PoC / Algorithm 

```text
coffee_soul/
├── poc/
│   └── source/
```

The original proof of concept was developed in python. The algorithm is a Smooth Weighted Round Robin implementation where people may order a different drink each time.  

## Containerized Deployment

```text
coffee_soul/
└── stack/
    ├── db/
    ├── db-seeding/
    ├── api/
    ├── web/
    └── infisical/
```

This application may be deployed either locally or a cloud environment.

The main components of this stack are:
* Postgresql for persisted storage 
* Java Spring Boot api + business logic
* React/Grommet UI
* Infisical secret management

### AWS

Currently deployed at [coffeesoul.kowalski.nz](https://coffeesoul.kowalski.nz)

### Local

May also be launched with `docker compose` in a local environment.

#### Steps to configure locally

##### Without Infisical

1) clone/download the repo: `$ git clone <url>` 
1) setup database credentials: `$ cd stack && cp db/.env.example .env`
1) build and start backend: `$ docker compose up -d --build db db-seeding api`
1) serve frontend: `$ cd web && npm install && npm start`

This will start and seed a local postgresql with data, standup the backend API, and serve a frontend at [localhost:3000](http://localhost:3000).

##### With Infisical

1) clone/download the repo: `$ git clone <url>` 
1) configure infisical environment: `$ cd stack/ && cp infisical/.env.example infisical/.env`
1) start infisical: `$  docker compose up -d infisical infisical-db infisical-redis`
1) configure infisical in web: 
    1) create admin account
    1) create org
    1) create project (e.g. 'coffee-soul')
    1) add secrets `POSTGRES_USER` and `POSTGRES_PASSWORD` with values
    1) note the *Project ID*
1) login on commandline: `$  infisical login --domain=http://localhost:8080`
1) start backend with infisical secret injection: `$ infisical run --domain=http://localhost:8080 --projectId=<project-id> --env=dev --path=/ -- docker compose up -d --build db db-seeding api`
1) serve frontend: `$ cd web && npm install && npm start`

## Data input

The `db-seeding` container seeds the database with a few people and drinks, but the UI also supports adding additional people and drink options.

## Prompts / AI

AI-assisted development was utilized in the creation of this deliverable. 

**The PoC and main algorithm was developed by hand** with use of a few online resources ([main inspiration](https://oneuptime.com/blog/post/2026-01-30-weighted-round-robin/view)).  

Following the algorithm development, AI was utilized to translate the PoC into a full-stack application and deploy into a cloud-native environment.

Prompt history was tracked during development and may be viewed under the `prompt/` directory. See corresponding `PROMPTS.md` for more information.