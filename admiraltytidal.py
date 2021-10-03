import requests
import json

from config import get_locations
from config import get_sources
from config import write_data

def get_tidal(tidal_source, location):
    url = tidal_source
    tidal_name = location['keys'][0]['admiralty-tidal']
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




