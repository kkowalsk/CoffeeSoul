import uuid

class CoffeeComrade:
    def __init__(self, name):
        self.uuid = uuid.uuid1()
        self.name = name
        self.brew = None

    def __str__(self):
        return f'{self.uuid}: {self.name} { 'drinkin\' ' + self.brew.name if self.brew is not None else ''}'

    def setBrew(self, brew):
        self.brew = brew


class Brew: 
    def __init__(self, name, description):
        self.uuid = uuid.uuid1()
        self.name = name
        self.description = description

    def __str__(self):
        return f"{self.uuid}: {self.name} - {self.description}"

def init():
    print("hello world")
    person = CoffeeComrade("kevin")
    print(person)
    brew = Brew("cortado", "1 part milk to 1 part espresso")
    print(brew)
    person.setBrew(brew)
    print(person)

if __name__ == "__main__":
    init()