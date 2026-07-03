import json
import os
import psycopg2

class DataConnection:
    """Connection to the coffee_soul Postgres db.

    Credentials come from POSTGRES_USER/POSTGRES_PASSWORD in the environment
    -- e.g. `infisical run` injecting them as process env vars before `docker
    compose up`, or a .env file for local dev.
    """

    def __init__(self):
        self.host = os.environ.get("POSTGRES_HOST", "db")
        self.port = int(os.environ.get("POSTGRES_PORT", "5432"))
        self.dbname = os.environ.get("POSTGRES_DB", "coffee_soul")
        self.user = os.environ["POSTGRES_USER"]
        self.password = os.environ["POSTGRES_PASSWORD"]
        self.connection = None

    def connect(self):
        self.connection = psycopg2.connect(
            host=self.host,
            port=self.port,
            dbname=self.dbname,
            user=self.user,
            password=self.password,
        )
        self.connection.autocommit = True
        return self.connection

    def close(self):
        if self.connection is not None:
            self.connection.close()
            self.connection = None

    def isOpen(self) -> bool:
        return self.connection is not None and self.connection.closed == 0

# brew/coffee_comrade are dropped and replaced on every run; CASCADE also
# takes out procurement/line_item since they FK-reference those two tables,
# so the full schema is re-applied to leave the db consistent afterward.
def dropAndRecreateSchema(cursor):
    cursor.execute("DROP TABLE IF EXISTS line_item, procurement, smooth_weighted_round_robin, coffee_comrade, brew CASCADE;")
    with open('./schema.sql', 'r') as file:
        cursor.execute(file.read())

def seedBrews(cursor) -> dict:
    brewIdByName = {}
    with open('./seedData/brews.json', 'r') as file:
        data = json.load(file)
        for b in data:
            cursor.execute(
                "INSERT INTO brew (name, price, description) VALUES (%s, %s, %s) RETURNING id",
                (b["name"], b["price"], b["description"]),
            )
            brewIdByName[b["name"]] = cursor.fetchone()[0]
            print(f'seeded brew {b["name"]}')
    return brewIdByName

def seedComrades(cursor, brewIdByName: dict):
    with open('./seedData/comrades.json', 'r') as file:
        data = json.load(file)
        for c in data:
            cursor.execute(
                "INSERT INTO coffee_comrade (name, default_brew_id) VALUES (%s, %s)",
                (c["name"], brewIdByName[c["defaultBrewId"]]),
            )
            print(f'seeded comrade {c["name"]}')

def init():
    db = DataConnection()
    db.connect()
    if not db.isOpen():
        print('unable to connect to postgres')
        exit(1)

    with db.connection.cursor() as cursor:
        dropAndRecreateSchema(cursor)
        brewIdByName = seedBrews(cursor)
        seedComrades(cursor, brewIdByName)

    db.close()
    print("database seeded: brew and coffee_comrade replaced")

if __name__ == "__main__":
    init()
