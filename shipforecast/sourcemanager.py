from manager import Manager
from source import Source


class SourceManager(Manager):
    def __init__(self, path):
        self.path = path
        self._load()
        self._parse()

    def _parse(self):
        self.sources = []
        for record in self.records:
            self.sources.append(Source(record))

    def getByType(self, type):
        for source in self.sources:
            if source.type == type:
                return source