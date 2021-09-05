import bs4.element
import requests
import os
import shutil
import json
from tqdm import tqdm
from bs4 import BeautifulSoup as bs
from urllib.parse import urlparse
from datetime import datetime
from datetime import timedelta
from pprint import pprint

def get_tide(url):
    soup = bs(requests.get(url).content, "html.parser")

    times = []

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
                        "Hi/Lo":position_value,
                        "depth":depth_value,
                        "time":time_value
                    }
                    times.append(time)

    return times;

#    for phase in soup.find_all(id="phase"):


def main():
    #locations = {"holyhead","conwy","dover","beaumaris","cemaes-bay"}
    locations = {"conwy"}

    url_base = "https://www.tidetimes.org.uk/"
    url_tide = "-tide-times-"
    now = datetime.now()
    locations_tide_calendar = []
    tide_dates = []
    for i in range(0, 7):
        target = now + timedelta(days=i)
        year = target.strftime("%Y")
        month = target.strftime("%m")
        day = target.strftime("%d")
        url_date = year + month + day

        tide_dates.append(url_date)

    for location in locations:

        tide_calendar = []
        for target_date in tide_dates:
            url = url_base + location + url_tide + target_date
            print(url)
            times = get_tide(url)
            tide_date = {
                target_date:times
            }
            tide_calendar.append(tide_date)

        location_tide_calendar = {
            location: tide_calendar
        }
        locations_tide_calendar.append(location_tide_calendar)

    filename = 'navigation/tides.json'

    with open(filename, 'w') as outfile:
        json.dump(locations_tide_calendar,outfile)

    pprint(locations_tide_calendar)

if __name__== "__main__":
    main()