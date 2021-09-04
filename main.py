import array

import bs4.element
import requests
import os
import shutil
import json
from tqdm import tqdm
from bs4 import BeautifulSoup as bs
from urllib.parse import urlparse


def is_valid(url):
    """
    Checks whether `url` is a valid URL.
    """
    parsed = urlparse(url)
    return bool(parsed.netloc) and bool(parsed.scheme)


def get_month(name):
    if name== "Aug":
        return "08"


def get_time(name):
    if name == "00:00":
        return "AM"
    else:
        return "PM"


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
                        output = {"wind":wind, "sea":sea, "weather":weather, "visibility":visibility}
                        forecast.append(output)

                forecast_json = {
                                    "area":area_name,
                                    "warning":area_warning,
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
                date = row.attrs.get("data-value")

                date_parts = date.split()

                day = date_parts[4]
                month_name = date_parts[5]
                month = get_month(month_name)
                year = date_parts[6]
                time_value = date_parts[0]
                time = get_time(time_value)

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
                date = row.attrs.get("data-value")

                date_parts = date.split()

                day = date_parts[4]
                month_name = date_parts[5]
                month = get_month(month_name)
                year = date_parts[6]
                time_value = date_parts[0]
                time = get_time(time_value)

                for image in list(row.children):
                    if isinstance(image, bs4.element.Tag):
                        url = image.attrs.get("src")
                        alt = image.attrs.get("alt")
                        alt_parts = alt.split()
                        type = alt_parts[3]

                maps.append([url, year, month, day, time, type, label])

    return maps


def download_map(forecast,map):
    year = forecast[1]
    month = forecast[2]
    day = forecast[3]
    time = forecast[4]
    type = forecast[5]

    url = map[0]
    label = map[6]

    pathname = 'forecast/' + year + '-' + month + '-' + day + '-' + time
    filename = pathname + '/'+ label + '.gif'
    ux_filename = 'navigation/' + label + '.gif'

    download_file(pathname, filename, url)
    copy_file(filename,ux_filename)


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


def save(maps, forecasts):
    year=maps[0][1]
    month=maps[0][2]
    day=maps[0][3]
    time=maps[0][4]

    pathname = 'forecast/' + year + '-' + month + '-' + day + '-' + time
    filename = pathname + '/data.json'

    with open(filename, 'w') as outfile:
        json.dump(forecasts, outfile)

    filename = 'navigation/data.json'

    with open(filename, 'w') as outfile2:
        json.dump(forecasts, outfile2)


def main():
    pressure = "https://www.metoffice.gov.uk/weather/maps-and-charts/surface-pressure"
    inshore = "https://www.metoffice.gov.uk/weather/specialist-forecasts/coast-and-sea/inshore-waters-forecast"

    # get all pressure maps
    maps = get_maps(pressure)
    for map in maps:
        # for each img, download it
        download_map(maps[0],map)

        # get all inshore forecasts
        forecasts = get_forecasts(inshore)
    #    for forecast in forecasts:
    # download_forecast(maps[0],forecast)

    save(maps,forecasts)

if __name__ == "__main__":
    main()

