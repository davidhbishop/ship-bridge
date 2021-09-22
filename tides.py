from datetime import datetime
from datetime import timedelta
import json

import bs4.element
from bs4 import BeautifulSoup as bs
import requests

from config import get_locations
from config import get_sources
from config import get_dates, get_date
from config import check_folder


def write_data(date_url, location_name, time, content_type, data):
    pathname = check_folder(date_url)
    time_url = time[:2] + time[3:5]
    filename = pathname + '/' + time_url + '-' + location_name.lower() + '-' + content_type.lower() + '.json'
    print(filename)
    with open(filename, 'w') as outfile:
        json.dump(data, outfile)


def get_times(tide_source, date, location):

    url = tide_source
    location_tide_name = location['keys'][0]['tide']
    url = url.replace('LOCATION',location_tide_name)
    url = url.replace('DATE',date['url'])
    soup = bs(requests.get(url).content, "html.parser")

    tides = get_timetable(soup)
    for tide in tides:
        write_data(date['url'], location['name'], tide['time'], tide['type'], tide)

    universe = get_universe(soup)
    for movement in universe:
        write_data(date['url'], location['name'], movement['time'], movement['type'], movement)

    for key in location['keys'][0]:
        if key=='gate':
            gates = get_gatetimes(location, date, tides)


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
                    if (position_value == 'High'):
                        type = 'hightide'

                    if (position_value == 'Low'):
                        type = 'lowtide'

                    time = {
                        "type": type,
                        "depth": depth_value,
                        "time": str(time_value)
                    }
                    tides.append(time)
    return tides


def get_universe(soup):
    universe = []
    moon = {'type': 'moonrise'}

    for phase in soup.find_all(id="phase"):
        index = 0
        for row in list(phase.children):
            if isinstance(row, bs4.element.Tag):
                index = index + 1

                if index==2:
                    for rise in row.find_next('span'):
                        sunrise = str(rise)
                        time = sunrise[:5]
                        out = {
                            'type': 'sunrise',
                            'time': time
                        }
                        universe.append(out)

                if index==3:
                    for set in row.find_next('span'):
                        sunset = str(set)
                        time = sunset[:5]
                        out = {
                            'type': 'sunset',
                            'time': time
                        }
                        universe.append(out)

                if index==4:
                    for img in row.find_all('img'):
                        moon_graphic = img['src']
                        #moon['graphic'] = str(moon_graphic)

                if index==5:
                    for rise in row.find_next('span'):
                        moonrise = str(rise)
                        time = moonrise[:5]
                        moon['time'] = time

                if index==6:
                    for set in row.find_next('span'):
                        moonset = str(set)
                        time = moonset[:5]
                        out = {
                            'type': 'moonset',
                            'time': time
                        }
                        universe.append(out)

                if index==7:
                    moon_phase = str(row.contents[1])
                    #moon['phase'] = moon_phase


    universe.append(moon)

    return universe


def get_gatetimes(location, date, tides):
    open_diff = ''
    close_diff = ''

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
        if tide['type']=='hightide':
            tidetime = str(tide['time'])
            tidehour = int(tidetime[:2])
            tideminute = int(tidetime[3:5])
            tideyear = int(date['year'])
            tidemonth = int(date['month'])
            tideday = int(date['day'])

            hightide = datetime(tideyear, tidemonth, tideday, tidehour, tideminute, 0)

            if open_diff == '-3':
                gateopen = hightide + timedelta(hours=-3)
                date_url = gateopen.strftime("%Y%m%d")
                time = gateopen.strftime("%H:%M")
                type = 'gateopen'
                json = {
                    'time': time,
                    'type': type
                }
                write_data(date_url, location['name'], time, 'gateopen', json)

            if close_diff == '+3':
                gateclose = hightide + timedelta(hours=+3)
                date_url = gateclose.strftime("%Y%m%d")
                time = gateclose.strftime("%H:%M")
                type = 'gateopen'
                json = {
                    'time': time,
                    'type': type
                }
                write_data(date_url, location['name'], time, 'gateclose', json)



def process_tides():
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
            get_times(tide_source, date, location)



