from datetime import timedelta


class TidalGate:
    def __init__(self, tide_time):
        self.tide_time = tide_time
        self.open_time = ''
        self.open_difference = ''
        self.close_time = ''
        self.close_difference = ''

    def set_open_difference(self, time_difference):
        self.open_difference = int(time_difference)
        self.open_time = self.tide_time + timedelta(hours=self.open_difference)

    def set_close_difference(self, time_difference):
        self.close_difference = int(time_difference)
        self.close_time = self.tide_time + timedelta(hours=self.close_difference)

    def get_open_time(self):
        return self.open_time.strftime("%H:%M")

    def get_open_date(self):
        return self.open_time.strftime("%Y%m%d")

    def get_close_time(self):
        return self.close_time.strftime("%H:%M")

    def get_close_date(self):
        return self.close_time.strftime("%Y%m%d")
