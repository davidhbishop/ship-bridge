from logmanager import LogManager


class Forecast:
    def __init__(self, source):
        self.source = source
        self.log = LogManager()
