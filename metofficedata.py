from urllib.request import urlopen
import json

from config import get_locations
from config import get_sources
from config import write_data


def get_metdata(weather_source, location):
    url = weather_source
    weather_name = location['keys'][0]['metoffice-data']
    url = url.replace('LOCATION',weather_name)

    response = urlopen(url)
    data = json.loads(response.read())
    periods = data['SiteRep']['DV']['Location']['Period']
    for period in periods:
        date = period['value']
        year = date[0:4]
        month = date[5:7]
        day = date[8:10]
        date_folder = str(year) + str(month) + str(day)
        datapoints = period['Rep']
        for datapoint in datapoints:
            time = datapoint['$']
            time_file = convert_min2hour(time)
            datapoint['type'] = 'datapoint'
            datapoint['time'] = time_file
            write_data(date_folder, location['name'], time_file, 'datapoints', datapoint)


def convert_min2hour(minutes):
    hours = int(minutes) / 60
    time = str(round(hours)) + ':00'
    length = len(time)
    if length == 4:
        time = '0' + time
    return time


def process_metofficedata():
    locations = get_locations()
    sources = get_sources()

    metoffice_source = ''

    for source in sources:
        if isinstance(source['type'], str):
            if source['type'] == 'metoffice-data':
                metoffice_source = source['url']

    for location in locations:
        if (location['name']=='Conwy'):
            get_metdata(metoffice_source, location)

