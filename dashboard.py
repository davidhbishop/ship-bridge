from datetime import datetime
from datetime import timedelta
import os
import json

import bs4.element
from bs4 import BeautifulSoup as bs
import requests

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
    for i in range(0, 14):
        target = now + timedelta(days=i)
        date = get_date(target)
        dates.append(date)
    return dates


def create_folder(date_url, location_name):

    pathname = "data/forecast/" + date_url + "/" +  location_name.lower()

    if not os.path.isdir(pathname):
        os.makedirs(pathname)
    return pathname


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


def get_times(pathname, tide_source, date, location):
    url = tide_source
    location_tide_name = location['keys'][0]['tide']
    url = url.replace('LOCATION',location_tide_name)
    url = url.replace('DATE',date['url'])
    soup = bs(requests.get(url).content, "html.parser")
    tides = get_timetable(soup)
    universe = get_universe(soup)

    times = {
        'tides': tides,
        'universe': universe
    }

    for key in location['keys'][0]:
        if key=='gate':
            gates = get_gatetimes(location, date, tides)
            times = {
                'tides': tides,
                'universe': universe,
                'gates': gates
            }

    filename = pathname + '/times.json'
    with open(filename, 'w') as outfile:
        json.dump(times,outfile)


def get_timetable(soup):
    tides = []
    for tide in soup.find_all(id="tides"):
        for row in tide.find_all("tr"):

            if row.has_attr('class'):
                if row['class'][0] == 'vis2':
                    position_value = row.contents[1]
                    position_value = position_value.contents[0]
                    time_value = row.contents[3]
                    time_value = time_value.contents[0]
                    time_value = time_value.contents[0]
                    depth_value = row.contents[5]
                    depth_value = depth_value.contents[0]
                    time = {
                        "Hi/Lo": position_value,
                        "depth": depth_value,
                        "time": time_value
                    }
                    tides.append(time)
    return tides


def get_universe(soup):
    sun = {
        'rise': '',
        'set': '',
        'graphic': ''
    }
    moon = {
        'rise': '',
        'set': '',
        'phase': '',
        'graphic': ''
    }

    for phase in soup.find_all(id="phase"):
        index = 0
        for row in list(phase.children):
            if isinstance(row, bs4.element.Tag):
                index = index + 1

                if index==1:
                    for img in row.find_all('img'):
                        sun['graphic'] = img['src']

                if index==2:
                    for rise in row.find_next('span'):
                        sun['rise'] = str(rise)

                if index==3:
                    for set in row.find_next('span'):
                        sun['set'] = str(set)

                if index==4:
                    for img in row.find_all('img'):
                        moon['graphic'] = img['src']

                if index==5:
                    for rise in row.find_next('span'):
                        moon['rise'] = str(rise)

                if index==6:
                    for set in row.find_next('span'):
                        moon['set'] = str(set)

                if index==7:
                    moon['phase'] = str(row.contents[1])

    return {
        'sun': sun,
        'moon': moon
    }


def get_gatetimes(location, date, tides):
    open_diff = ''
    close_diff = ''
    outgates = []

    """
    Get open time difference from location    
    Get close time difference from location
    """

    for key in location['keys'][0]:
        if key=='gate':
            open_diff = location['keys'][0]['gate'][0]['open']
            close_diff = location['keys'][0]['gate'][0]['close']



    """
    Get high_tide as datetime object
    """
    for tide in tides:
        if tide['Hi/Lo']=='High':
            tidetime = str(tide['time'])
            tidehour = int(tidetime[:2])
            tideminute = int(tidetime[3:5])
            tideyear = int(date['year'])
            tidemonth = int(date['month'])
            tideday = int(date['day'])
            hightide = datetime(tideyear, tidemonth, tideday, tidehour, tideminute,0)
            if open_diff == '-3':
                gateopen = hightide + timedelta(hours=-3)

            if close_diff == '+3':
                gateclose = hightide + timedelta(hours=+3)

            open = {
                "year": gateopen.strftime("%Y"),
                "month": gateopen.strftime("%m"),
                "day": gateopen.strftime("%d"),
                'hour': gateopen.strftime('%H'),
                'minute': gateopen.strftime('%M')
            }

            close = {
                "year": gateclose.strftime("%Y"),
                "month": gateclose.strftime("%m"),
                "day": gateclose.strftime("%d"),
                'hour': gateclose.strftime('%H'),
                'minute': gateclose.strftime('%M')
            }

            outtime = {
                'tide': tidetime,
                "year": tideyear,
                "month": tidemonth,
                "day": tideday,
                'hour': tidehour,
                'minute': tideminute
            }

            outtide = {
                'tide': outtime,
                'open': open,
                'close': close
            }

            outgates.append(outtide)

    return outgates


def main():
    dates = get_dates()
    locations = get_locations()
    sources = get_sources()

    tide_source = ''

    for source in sources:
        if isinstance(source['type'], str):
            if source['type'] == 'tide-times':
                tide_source = source['url']

    for date in dates:
        for location in locations:
            pathname = create_folder(date['url'], location['name'])
            get_times(pathname, tide_source, date, location)



if __name__ == "__main__":
    main()

