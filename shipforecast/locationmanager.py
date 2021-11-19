from manager import  Manager
from location import Location


class LocationManager(Manager):
    def __init__(self, path):
        self.path = path
        self._load()
        self._parse()

    def _parse(self):
        self.locations = []
        for record in self.records:
            self.locations.append(Location(record))

    def getItems(self):
        return self.locations

