from datetime import datetime
from datetime import timedelta
import os
import json

from ics import Calendar

def get_summer(current_timestamp, current_year):
    with open('data/clocks/united-kingdom.ics','r') as clockfile:
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


def get_date(target):
    date = {
        "year": target.strftime("%Y"),
        "month": target.strftime("%m"),
        "day": target.strftime("%d"),
        "url": target.strftime("%Y%m%d")
    }
    return date

def get_dates():
    dates = []
    now = datetime.now()
    for i in range(0, 7):
        target = now + timedelta(days=i)
        date = get_date(target)
        dates.append(date)
    return dates

def get_locations():
    with open('data/locations/locations.json','r') as locationfile:
        data = locationfile.read()
    locations = json.loads(data)
    return locations


def get_sources():
    with open('data/sources/sources.json','r') as sourcefile:
        data = sourcefile.read()
    sources = json.loads(data)
    return sources

def check_folder(date_url):
    pathname = "data/forecast/" + date_url
    if not os.path.isdir(pathname):
        os.makedirs(pathname)
    return pathname

def write_data(date_url, location_name, time, content_type, data):
    pathname = check_folder(date_url)
    time_url = time[:2] + time[3:5]
    filename = pathname + '/' + time_url + '-' + location_name.lower() + '-' + content_type.lower() + '.json'
    print(filename)
    with open(filename, 'w') as outfile:
        json.dump(data, outfile)