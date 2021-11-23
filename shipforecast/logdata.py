class LogData:
    def __init__(self, date, location_name, type):
        self.date = date
        self.location_name = location_name
        self.type = type
        self.data = {}
        self.hour = ''
        self.minute = ''

    def set_time(self, time):
        self.hour = time[:2]
        self.minute = time[3:5]

    def set_time_short(self, time):
        self.hour = time[:2]
        self.minute = time[2:4]

    def add_data(self, key, value):
        self.data[key] = value

    def set_data(self, data):
        self.data = data

    def get_time(self):
        return self.hour + self.minute

    def get_data(self):
        return self.data

