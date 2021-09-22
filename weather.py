import bs4.element
from bs4 import BeautifulSoup as bs
import requests

from config import get_locations
from config import get_sources
from config import check_folder


def get_weather(weather_source, location):
    url = weather_source
    weather_name = location['keys'][0]['weather']
    url = url.replace('LOCATION',weather_name)
    soup = bs(requests.get(url).content, "html.parser")

    weather = get_weathertable(soup)
    #write_data(date['url'], location['name'], tide['time'], tide['type'], tide)

def get_weathertable(soup):
    days = []
    for days in soup.find_all(class_='forecast-day'):
        index=0


def process_weather():
    locations = get_locations()
    sources = get_sources()

    weather_source = ''

    for source in sources:
        if isinstance(source['type'], str):
            if source['type'] == 'weather':
                weather_source = source['url']

    for location in locations:
        get_weather(weather_source, location)
