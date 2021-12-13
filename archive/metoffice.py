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
from config import check_folder, get_sources

def is_valid(url):
    """
    Checks whether `url` is a valid URL.
    """
    parsed = urlparse(url)
    return bool(parsed.netloc) and bool(parsed.scheme)


def get_month(name):
    if name== "Jan":
        return "01"
    if name== "Feb":
        return "02"
    if name== "Mar":
        return "03"
    if name== "Apr":
        return "04"
    if name== "May":
        return "05"
    if name== "Jun":
        return "06"
    if name== "Jul":
        return "07"
    if name== "Aug":
        return "08"
    if name== "Sep":
        return "09"
    if name== "Oct":
        return "10"
    if name== "Nov":
        return "11"
    if name== "Dec":
        return "12"


def get_time(name):
    if name == "00:00":
        return "0000"
    else:
        return "1200"

def get_range(name):
    name = name[5:]
    type = name[:-1]
    range = int(name[-1:])

    if range > 0:
        range = range * 12

    if range == 0:
        output = 'analysis-' + type.lower()
    else:
        output = 'outlook-' + type.lower() + '-' + str(range) + '-hrs'

    return output


def get_forecasts(url):
    soup = bs(requests.get(url).content, "html.parser")

    situation = '';
    stamp = '';

    for overview in soup.find_all(id='sea-area-overview'):
        for summary in overview.find_all(id='summary'):
            for details in summary.find_all('p'):
                if details.has_attr('class'):
                        if details['class'][0] == 'synopsis-text':
                                situation = details.contents[0]

            for times in summary.find_all(id='sea-forecast-time'):
                timestamps = times.find_all('time')
                stamp = timestamps[0].contents[0]

    summary = {
        "general": situation,
        "time": stamp
    }

    forecasts = []

    forecasts.append(summary)

    for sections in soup.find_all(id="inshore-waters-areas"):
        for section in list(sections.children):
            if isinstance(section, bs4.element.Tag):

                forecast = []
                area_name = ''
                area_warning = ''
                wind = ''
                sea = ''
                weather = ''
                visibility = ''
                for heading in section.find_all('h2'):
                    area_name = heading.contents[0]

                for warnings in section.find_all('p'):
                    area_warning = warnings.contents[0]

                for info in section.find_all('dl'):
                    if isinstance(info, bs4.element.Tag):
                        data = list(info.children)
                        wind = data[3].contents[0]
                        sea = data[7].contents[0]
                        weather = data[11].contents[0]
                        visibility = data[15].contents[0]
                        output = {
                            "wind": wind,
                            "sea": sea,
                            "weather": weather,
                            "visibility": visibility
                        }
                        forecast.append(output)

                forecast_json = {
                                    "area": area_name,
                                    "warning": area_warning,
                                    "forecast": forecast
                                 }

                forecasts.append(forecast_json)

    return forecasts


def get_maps(url):
    soup = bs(requests.get(url).content, "html.parser")
    maps = []

    for rows in soup.find_all(id="bwCharts"):
        for row in list(rows.children):
            if isinstance(row, bs4.element.Tag):
                label = row.attrs.get("id")
                label = get_range(label)
                date = row.attrs.get("data-value")

                date_parts = date.split()

                day = date_parts[4]
                month_name = date_parts[5]
                month = get_month(month_name)
                year = date_parts[6]
                time = date_parts[0]

                for image in list(row.children):
                    if isinstance(image, bs4.element.Tag):
                        url = image.attrs.get("src")
                        alt = image.attrs.get("alt")
                        alt_parts = alt.split()
                        type = alt_parts[3]

                maps.append([url, year, month, day, time, type, label])

    for rows in soup.find_all(id="colourCharts"):
        for row in list(rows.children):
            if isinstance(row, bs4.element.Tag):
                label = row.attrs.get("id")
                label = get_range(label)
                date = row.attrs.get("data-value")

                date_parts = date.split()

                day = date_parts[4]
                month_name = date_parts[5]
                month = get_month(month_name)
                year = date_parts[6]
                time = date_parts[0]

                for image in list(row.children):
                    if isinstance(image, bs4.element.Tag):
                        url = image.attrs.get("src")
                        alt = image.attrs.get("alt")
                        alt_parts = alt.split()
                        type = alt_parts[3]

                maps.append([url, year, month, day, time, type, label])

    return maps


def download_map(map):
    year = map[1]
    month = map[2]
    day = map[3]
    time = map[4]
    time = get_time(time)

    url = map[0]
    label = map[6]

    pathname = 'data/forecast/' + str(year) + str(month).zfill(2) + str(day).zfill(2)
    filename = pathname + '/'+ time + '-pressure-map-' + label +'.gif'

    download_file(pathname, filename, url)


def copy_file(source, destination):
    # Copy the content of
    # source to destination

    try:
        shutil.copy(source, destination)
        print("File copied successfully.")

    # If source and destination are same
    except shutil.SameFileError:
        print("Source and destination represents the same file.")

    # If there is any permission issue
    except PermissionError:
        print("Permission denied.")

    # For other errors
    except:
        print("Error occurred while copying file.")

def download_file(pathname, filename, url):
    """
    Downloads a file given an URL and puts it in the folder `pathname`
    """
    # if path doesn't exist, make that path dir
    if not os.path.isdir(pathname):
        os.makedirs(pathname)
    # download the body of response by chunk, not immediately
    response = requests.get(url, stream=True)

    # get the total file size
    file_size = int(response.headers.get("Content-Length", 0))

    # progress bar, changing the unit to bytes instead of iteration (default by tqdm)
    progress = tqdm(response.iter_content(1024), f"Downloading {filename}", total=file_size, unit="B", unit_scale=True,
                    unit_divisor=1024)
    with open(filename, "wb") as f:
        for data in progress.iterable:
            # write data read to the file
            f.write(data)
            # update the progress bar manually
            progress.update(len(data))


def save(forecasts):
    now = datetime.now()
    today_date = now.strftime("%Y%m%d")
    area = 0

    tomorrow_time = now + timedelta(days=1)
    tomorrow_date = tomorrow_time.strftime("%Y%m%d")

    for forecast in forecasts:
        if (area > 0):
            today = {
                "area": forecast['area'],
                "warning": forecast['warning'],
                "forecast": forecast['forecast'][0]
            }

            tomorrow = {
                "area": forecast['area'],
                "warning": forecast['warning']
            }
            if len(forecast['forecast'])==2:
                tomorrow['outlook'] = forecast['forecast'][1]

            pathname = 'data/forecast/' + today_date
            check_folder(today_date)
            filename = pathname + '/0000-inshore-area-' + str(area) + '.json'
            print(filename)
            with open(filename, 'w') as outfile:
                json.dump(today, outfile)

            pathname2 = 'data/forecast/' + tomorrow_date
            check_folder(tomorrow_date)
            filename2 = pathname2 + '/0000-inshore-area-' + str(area) + '.json'
            print(filename2)
            with open(filename2, 'w') as outfile2:
                json.dump(tomorrow, outfile2)

        area = area + 1;



def process_metoffice():
    sources = get_sources()
    pressure = ""
    inshore = ""

    for source in sources:
        if isinstance(source['type'], str):
            if source['type'] == 'metoffice-pressure':
                pressure = source['url']

        if isinstance(source['type'], str):
            if source['type'] == 'metoffice-inshore':
                inshore = source['url']


    # get all pressure maps
    maps = get_maps(pressure)
    for map in maps:
        # for each img, download it
        download_map(map)

        # get all inshore forecasts
        forecasts = get_forecasts(inshore)

    save(forecasts)

