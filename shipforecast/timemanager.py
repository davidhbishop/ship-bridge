from datetime import timedelta
from ics import Calendar

class TimeManager():
    def __init__(self):
        pass

    def get_summer(current_timestamp, current_year):
        with open('data/clocks/united-kingdom.ics', 'r') as clockfile:
            clockdata = clockfile.read()
        c = Calendar(clockdata)

        for event in c.events:
            event_year = event.begin.date().strftime('%Y')
            event_timestamp = event.begin.timestamp
            event_name = event.name
            if current_year == event_year:
                if event_name == 'Start of British Summer Time':
                    start_timestamp = event_timestamp
                if event_name == 'End of British Summer Time':
                    end_timestamp = event_timestamp

        if current_timestamp < start_timestamp:
            return 'winter'
        if current_timestamp > end_timestamp:
            return 'winter'

        return 'summer'