class Source:
    def __init__(self, config):
        for key in config:
            if key == 'url':
                self.url = config[key]
            if key == 'type':
                self.type = config[key]
            if key == 'DATE':
                self.date = config[key]
            if key == 'key':
                self.key = config[key]
