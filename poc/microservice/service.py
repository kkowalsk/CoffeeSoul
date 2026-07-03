from __future__ import annotations
import os
import uuid
import datetime
import json
import sortedcontainers
import psycopg2

class CoffeeComrade:
    def __init__(self, name: str, brew: Brew = None):
        self.uuid = uuid.uuid4()
        self.name = name
        self.brew = brew

    def __str__(self):
        return f'{self.uuid}: {self.name} { 'drinkin\' ' + self.brew.name if self.brew is not None else ''}'

    def setBrew(self, brew: Brew):
        self.brew = brew

class Brew:
    def __init__(self, name: str, price: float, description: str):
        self.uuid = uuid.uuid4()
        self.name = name
        self.description = description
        self.price = price

    def __str__(self):
        return f'{self.uuid}: {self.name} - ${self.price} - {self.description}'

class Procurement:
    def __init__(self):
        self.uuid = uuid.uuid4()
        self.timestamp = datetime.datetime.now(datetime.timezone.utc)
        self.items = []
        self.payee = None

    def __str__(self):
        return f'{self.uuid}: {self.timestamp}. payee {self.payee}. items:\n  ' + '\n  '.join([str(item) for item in self.items])

    def addLineItem(self, lineItem: LineItem):
        self.items.append(lineItem)

    def removeLineItem(self, lineItem: LineItem):
        self.items.remove(lineItem)

    def calculateTotal(self) -> float:
        runningTotal = 0
        for item in self.items:
            runningTotal += item.brew.price
        return runningTotal

    def setPayee(self, payee: CoffeeComrade):
        self.payee = payee

class LineItem:
    def __init__(self, comrade: CoffeeComrade, brew: Brew):
        self.uuid = uuid.uuid4()
        self.brew = brew
        self.comrade = comrade

    def __str__(self):
        return f'{self.uuid}: line item - {self.brew.name} for {self.comrade.name}'

# inspiration pulled from here
# https://oneuptime.com/blog/post/2026-01-30-weighted-round-robin/view
class SmoothWeightedRoundRobin:
    def __init__(self, enforceOrder: bool = False):
        self.uuid = uuid.uuid4()
        self.procurements = sortedcontainers.SortedKeyList(key=lambda p: p.timestamp)
        self.comradeWeights = dict()
        self.comradeTotals = dict()
        self.comradePayments = dict()
        self.enforceOrder = enforceOrder

    # use to build up a history for testing
    def _add(self, procurement: Procurement):
        if self.enforceOrder:
            raise RuntimeError('insertion-based enforcement configured')

        self.procurements.add(procurement)
        for i in procurement.items:
            self.comradeWeights.setdefault(i.comrade, 0)
            self.comradeTotals.setdefault(i.comrade, 0)
            self.comradePayments.setdefault(i.comrade, 0)

    def calculateHistoricalPayees(self):
        print('calculating historical payees')
        overallTotal = 0;
        for p in self.procurements:
            total = p.calculateTotal()
            overallTotal += total

            for li in p.items:
                self.comradeWeights[li.comrade] += li.brew.price
                self.comradeTotals[li.comrade] += li.brew.price

            payee = None
            for comrade, weight in self.comradeWeights.items():
                if payee is None or weight > self.comradeWeights[payee]:
                    payee = comrade
            self.comradeWeights[payee] -= total
            self.comradePayments[payee] += 1
            p.setPayee(payee)

        for comrade in self.comradeWeights:
            print(f'{comrade.name} total {self.comradeTotals[comrade]}, weight {self.comradeWeights[comrade]}, payments {self.comradePayments[comrade]}. total% {round(self.comradeTotals[comrade]/overallTotal, 3)} vs. payment% {self.comradePayments[comrade]/len(self.procurements)}')

    # insertion based enforcement
    def process(self, procurement: Procurement):
        if not self.enforceOrder:
            raise RuntimeError('insertion enforcement not configured')

        procurement.timestamp = datetime.datetime.now(datetime.timezone.utc)
        self.procurements.add(procurement)
        for i in procurement.items:
            self.comradeWeights.setdefault(i.comrade, 0)
            self.comradeTotals.setdefault(i.comrade, 0)
            self.comradePayments.setdefault(i.comrade, 0)

        total = procurement.calculateTotal()

        for li in procurement.items:
            self.comradeWeights[li.comrade] += li.brew.price
            self.comradeTotals[li.comrade] += li.brew.price

        payee = None
        for comrade, weight in self.comradeWeights.items():
            if payee is None or weight > self.comradeWeights[payee]:
                payee = comrade
        self.comradeWeights[payee] -= total
        self.comradePayments[payee] += 1
        procurement.setPayee(payee)

    def __str__(self):
        return "".join(f'{p}\n' for p in self.procurements)

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

# brews/comrades are no longer read from seedData here -- database-seeding
# owns that JSON and writes it to the db, so this loads the same rows back
# out via DataConnection instead. The db-generated id replaces each object's
# client-side uuid so line_item/procurement inserts can use it as an FK.
def loadBrewsAndComrades(db: DataConnection) -> tuple[dict, dict]:
    brewsByName = {}
    comradesByName = {}
    with db.connection.cursor() as cursor:
        cursor.execute("SELECT id, name, price, description FROM brew")
        for id, name, price, description in cursor.fetchall():
            brew = Brew(name, float(price), description)
            brew.uuid = id
            brewsByName[name] = brew

        cursor.execute(
            "SELECT cc.id, cc.name, b.name FROM coffee_comrade cc LEFT JOIN brew b ON b.id = cc.default_brew_id"
        )
        for id, name, defaultBrewName in cursor.fetchall():
            comrade = CoffeeComrade(name)
            comrade.uuid = id
            if defaultBrewName is not None:
                comrade.setBrew(brewsByName[defaultBrewName])
            comradesByName[name] = comrade

    return brewsByName, comradesByName

# one row per SmoothWeightedRoundRobin run; every procurement processed in
# this run references it via round_robin_id.
def insertRoundRobinRun(cursor) -> str:
    cursor.execute("INSERT INTO smooth_weighted_round_robin DEFAULT VALUES RETURNING id")
    return cursor.fetchone()[0]

def insertProcurement(cursor, procurement: Procurement, roundRobinId: str):
    cursor.execute(
        "INSERT INTO procurement (\"timestamp\", payee_id, round_robin_id) VALUES (%s, %s, %s) RETURNING id",
        (procurement.timestamp, procurement.payee.uuid, roundRobinId),
    )
    procurementId = cursor.fetchone()[0]
    for li in procurement.items:
        cursor.execute(
            "INSERT INTO line_item (procurement_id, comrade_id, brew_id) VALUES (%s, %s, %s)",
            (procurementId, li.comrade.uuid, li.brew.uuid),
        )

def init():
    db = DataConnection()
    db.connect()
    if not db.isOpen():
        print('unable to connect to postgres')
        exit(1)

    brewsByName, comradesByName = loadBrewsAndComrades(db)

    procurements = []
    with open('./seedData/orders_mixed.json', 'r') as file:
        data = json.load(file)
        for o in data:
            procurement = Procurement()
            for li in o["lineItems"]:
                lineItem = LineItem(comradesByName[li["comradeName"]], brewsByName[li["brewName"]])
                procurement.addLineItem(lineItem)
            procurements.append(procurement)

    roundRobin = SmoothWeightedRoundRobin(True)
    print("\nRoundRobin:")
    print(roundRobin)
    print()
    with db.connection.cursor() as cursor:
        roundRobinId = insertRoundRobinRun(cursor)
        for i in range(10):
            roundRobin.process(procurements[i])
            insertProcurement(cursor, procurements[i], roundRobinId)
            print(f'{procurements[i].payee.name}\'s turn to pay')

    db.close()

if __name__ == "__main__":
    init()
