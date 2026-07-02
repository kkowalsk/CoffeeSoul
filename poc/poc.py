from __future__ import annotations
import uuid
import datetime
import json
import sortedcontainers

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

class Order:
    def __init__(self):
        self.uuid = uuid.uuid4()
        self.timestamp = datetime.datetime.now()
        self.items = []
        self.payee = None

    def __str__(self):
        return f'{self.uuid}: {self.timestamp}. payee {self.payee}. items:\n  ' + '\n  '.join([str(item) for item in self.items])

    def addLineItem(self, lineItem: LineItem):
        self.items.append(lineItem)

    def removeLineItem(self, lineItem: LineItem):
        self.items.remove(lineItem)

    def calculateTotal(self) -> int:
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
        self.orders = sortedcontainers.SortedKeyList(key=lambda o: o.timestamp)
        self.comradeWeights = dict()
        self.comradeTotals = dict()
        self.comradePayments = dict()
        self.enforceOrder = enforceOrder
        
    # use to build up a history for testing
    def _add(self, order: Order):
        if self.enforceOrder:
            raise RuntimeError('insertion-based enforcement configured')

        self.orders.add(order)
        for i in order.items:
            self.comradeWeights.setdefault(i.comrade, 0)
            self.comradeTotals.setdefault(i.comrade, 0)
            self.comradePayments.setdefault(i.comrade, 0)

    def calculateHistoricalPayees(self):
        print('calculating historical payees')
        overallTotal = 0;
        for o in self.orders:
            total = o.calculateTotal()
            overallTotal += total

            # print(f'{o}')
            for li in o.items:
                self.comradeWeights[li.comrade] += li.brew.price
                self.comradeTotals[li.comrade] += li.brew.price
                # print(f'{li}. new weight {self.comradeWeights[li.comrade]}')
                # print(f'{li}. new total  {self.comradeTotals[li.comrade]}')


            # print()
            payee = None
            for comrade, weight in self.comradeWeights.items():
                if payee is None or weight > self.comradeWeights[payee]:
                    payee = comrade
            self.comradeWeights[payee] -= total
            self.comradePayments[payee] += 1
            # print(f'{payee.name}\'s new weight is {self.comradeWeights[payee]}')
            o.setPayee(payee)
            # print()
        
        for comrade in self.comradeWeights:
            print(f'{comrade.name} total {self.comradeTotals[comrade]}, weight {self.comradeWeights[comrade]}, payments {self.comradePayments[comrade]}. total% {round(self.comradeTotals[comrade]/overallTotal, 3)} vs. payment% {self.comradePayments[comrade]/len(self.orders)}')

    # insertion based enforcement
    def process(self, order: Order):
        if not self.enforceOrder:
            raise RuntimeError('insertion enforcement not configured')

        order.timestamp = datetime.datetime.now()
        self.orders.add(order)
        for i in order.items:
            self.comradeWeights.setdefault(i.comrade, 0)
            self.comradeTotals.setdefault(i.comrade, 0)
            self.comradePayments.setdefault(i.comrade, 0)
        
        total = order.calculateTotal()
        
        for li in order.items:
            self.comradeWeights[li.comrade] += li.brew.price
            self.comradeTotals[li.comrade] += li.brew.price
        

        payee = None
        for comrade, weight in self.comradeWeights.items():
            if payee is None or weight > self.comradeWeights[payee]:
                payee = comrade
        self.comradeWeights[payee] -= total
        self.comradePayments[payee] += 1
        order.setPayee(payee)

    def __str__(self):
        return "".join(f'{o}\n' for o in self.orders)

def init():
    # print("hello world")
    # person = CoffeeComrade("kevin")
    # print(person)
    # cortado = Brew("cortado", 6.5, "1 part milk to 1 part espresso")
    # cold = Brew("cold brew coffee", 5, "cold water extracted")
    # print(cortado)
    # person.setBrew(cortado)
    # print(person)
    # lineItem1 = LineItem(person, cortado)
    # lineItem2 = LineItem(person, cold)
    # order = Order()
    # order.addLineItem(lineItem1)
    # order.addLineItem(lineItem2)
    # print(order)
    # print(order.calculateTotal())

    brews = []
    comrades = []
    orders = []
    with open('./seedData/brews.json', 'r') as file:
        data = json.load(file)
        for b in data:
            brews.append(Brew(b["name"], b["price"], b["description"]))
            print(brews[-1])

    brewsByName = {brew.name: brew for brew in brews}

    with open('./seedData/comrades.json', 'r') as file:
        data = json.load(file)
        for c in data:
            comrade = CoffeeComrade(c["name"])
            comrade.setBrew(brewsByName[c["defaultBrewId"]])
            comrades.append(comrade)
            print(comrades[-1])

    comradesByName = {comrade.name: comrade for comrade in comrades}

    with open('./seedData/orders_mixed.json', 'r') as file:
        data = json.load(file)
        for o in data:
            order = Order()
            for li in o["lineItems"]:
                lineItem = LineItem(comradesByName[li["comradeName"]], brewsByName[li["brewName"]])
                order.addLineItem(lineItem)
            orders.append(order)
            # print(orders[-1])
            # print(orders[-1].calculateTotal())

    # for comrade in comrades:
    #     total = 0
    #     for order in orders:
    #         for lineItem in order.items:
    #             if lineItem.comrade is comrade:
    #                 total += lineItem.brew.price

        # print(comrade.name, total)

    roundRobin = SmoothWeightedRoundRobin(True)
    # for o in reversed(orders):
        # roundRobin._add(o)
    print("\nRoundRobin:")
    print(roundRobin)
    print()
    # roundRobin.calculateHistoricalPayees()
    for i in range(10):
        roundRobin.process(orders[i])
        print(f'{orders[i].payee.name}\'s turn to pay')


if __name__ == "__main__":
    init()