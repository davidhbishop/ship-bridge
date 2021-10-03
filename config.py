from datetime import datetime
from datetime import timedelta
import os
import json

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