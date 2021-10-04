import requests
import json
from datetime import datetime
from datetime import timedelta

from config import get_locations
from config import get_sources
from config import write_data

def get_tidal(tidal_source, location):
    url = tidal_source
    tidal_name = location['keys'][0]['admiralty-tidal']
    open_diff = ''
    close_diff = ''

    for key in location['keys'][0]:
        if key=='gate':
            open_diff = location['keys'][0]['gate'][0]['open']
            close_diff = location['keys'][0]['gate'][0]['close']

    url = url.replace('LOCATION',tidal_name)

    url = tidal_source.replace('LOCATION', tidal_name)

    session = requests.session()
    response = session.get(url, headers={'Ocp-Apim-Subscription-Key': 'e02bad75e2fd40139358632685fe3c18'})

    tide_events = json.loads(response.text)
    for tide_event in tide_events:
        date = tide_event['DateTime']
        year = date[0:4]
        month = date[5:7]
        day = date[8:10]

        time = date[11:16]
        date_folder = str(year) + str(month) + str(day)

        event_type = tide_event['EventType']
        height = round(tide_event['Height'],2)
        event_data = {
            'type': event_type,
            'time': time,
            'depth': height
            }

        write_data(date_folder, location['name'], time, event_type, event_data)
        if (event_type=='HighWater'):
            hour = date[11:13]
            minute = date[14:16]
            hightide = datetime(int(year), int(month), int(day), int(hour), int(minute), 0)

            if open_diff == '-3':
                gateopen = hightide + timedelta(hours=-3)
                date_url = gateopen.strftime("%Y%m%d")
                opentime = gateopen.strftime("%H:%M")
                type = 'gateopen'
                opendata = {
                    'time': time,
                    'type': type
                }
                write_data(date_url, location['name'], opentime, 'gateopen', opendata)

            if close_diff == '+3':
                gateclose = hightide + timedelta(hours=+3)
                date_url = gateclose.strftime("%Y%m%d")
                closetime = gateclose.strftime("%H:%M")
                type = 'gateclose'
                closedata = {
                    'time': time,
                    'type': type
                }
                write_data(date_url, location['name'], closetime, 'gateclose', closedata)


def process_tidal():
    locations = get_locations()
    sources = get_sources()

    tidal_source = ''
    target_location = ''

    for source in sources:
        if isinstance(source['type'], str):
            if source['type'] == 'admiralty-tidal':
                tidal_source = source['url']

    for location in locations:
        if (location['name']=='Conwy'):
            get_tidal(tidal_source, location)




