class Location:
    def __init__(self, config):
        self.name = config['name']
        self.type = config['type']
        self.keys = config['keys'][0]

    def get_name(self):
        return self.name

    def has(self, name):
        for key in self.keys:
            if (key==name):
                return True
        return False

    def get_key(self, name):
        return self.keys[name]

    def get_gate_open(self):
        return self.keys['gate'][0]['open']

    def get_gate_close(self):
        return self.keys['gate'][0]['close']
