import json

class Manager():
    def __init__(self, path):
        self.path = path
        self._load()

    def _load(self):
        with open(self.path,'r') as file:
            data = file.read()
        self.records = json.loads(data)
        return True

    def getItems(self):
        return self.records