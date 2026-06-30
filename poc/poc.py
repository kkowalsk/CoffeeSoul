import uuid
import datetime

class CoffeeComrade:
    def __init__(self, name):
        self.uuid = uuid.uuid4()
        self.name = name
        self.brew = None

    def __str__(self):
        return f'{self.uuid}: {self.name} { 'drinkin\' ' + self.brew.name if self.brew is not None else ''}'

    def setBrew(self, brew):
        self.brew = brew


class Brew: 
    def __init__(self, name, price, description):
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

    def __str__(self):
        return f'{self.uuid}: {self.timestamp} - items:\n  ' + '\n  '.join([str(item) for item in self.items])

    def addLineItem(self, lineItem):
        self.items.append(lineItem)

    def removeLineItem(self, lineItem):
        self.items.remove(lineItem)

    def calculateTotal(self):
        runningTotal = 0
        for item in self.items:
            runningTotal += item.brew.price
        return runningTotal

class LineItem:
    def __init__(self, coffeeComrade, brew):
        self.uuid = uuid.uuid4()
        self.brew = brew
        self.coffeeComrade = coffeeComrade

    def __str__(self):
        return f'{self.uuid}: line item - {self.brew.name} for {self.coffeeComrade.name}'


def init():
    print("hello world")
    person = CoffeeComrade("kevin")
    print(person)
    cortado = Brew("cortado", 6.5, "1 part milk to 1 part espresso")
    cold = Brew("cold brew coffee", 5, "cold water extracted")
    print(cortado)
    person.setBrew(cortado)
    print(person)
    lineItem1 = LineItem(person, cortado)
    lineItem2 = LineItem(person, cold)
    order = Order()
    order.addLineItem(lineItem1)
    order.addLineItem(lineItem2)
    print(order)
    print(order.calculateTotal())

if __name__ == "__main__":
    init()