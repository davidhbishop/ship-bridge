from datetime import timedelta
from datetime import datetime
from ics import Calendar


class BritishTimeManager:
    def __init__(self, time_raw):
        with open('../data/clocks/united-kingdom.ics', 'r') as clockfile:
            self.clock_data = clockfile.read()

        self.calendar = Calendar(self.clock_data)
        self.time_raw = time_raw
        self.date_time = self._get_datetime_from_tidaltime(self.time_raw)
        self.time_stamp = self.date_time.timestamp()
        self.year = self.date_time.strftime("%Y")
        self.is_summer = self._get_summer()
        self.corrected_time = self._set_corrected_time()

    def _set_corrected_time(self):
        if (self.is_summer):
            return self.date_time + timedelta(hours=+1)
        else:
            return self.date_time

    def _get_summer(self):

        for event in self.calendar.events:
            event_year = event.begin.date().strftime('%Y')
            event_timestamp = event.begin.timestamp
            event_name = event.name
            if self.year == event_year:
                if event_name == 'Start of British Summer Time':
                    start_timestamp = event_timestamp
                if event_name == 'End of British Summer Time':
                    end_timestamp = event_timestamp

        if self.time_stamp < start_timestamp:
            return False
        if self.time_stamp > end_timestamp:
            return False

        return True

    def get_british_summer_time(self, time):
        return time + timedelta(hours=+1)

    def _get_datetime_from_tidaltime(self, tidal_time):
        year = tidal_time[0:4]
        month = tidal_time[5:7]
        day = tidal_time[8:10]
        hour = tidal_time[11:13]
        minute = tidal_time[14:16]

        # Convert from UTC to British Summer Time (if needed)
        return datetime(int(year), int(month), int(day), int(hour), int(minute), 0)

    def get_time(self):
        return self.corrected_time.strftime("%H:%M")

    def get_time_short(self):
        return self.corrected_time.strftime("%H%M")

    def get_date(self):
        return self.corrected_time.strftime("%Y%m%d")