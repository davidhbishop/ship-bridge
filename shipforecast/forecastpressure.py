from forecast import Forecast
from requestforecast import RequestForecast
from requestforecastfile import RequestForecastFile
import bs4.element
from bs4 import BeautifulSoup as bs
from logdata import LogData


class ForecastPressure(Forecast):
    def _get_data(self):
        url = self._get_url()
        request = RequestForecast()
        return request.get(url)

    def _get_url(self):
        url = self.source.url
        return url

    def _get_month(self, name):
        if name == "Jan":
            return "01"
        if name == "Feb":
            return "02"
        if name == "Mar":
            return "03"
        if name == "Apr":
            return "04"
        if name == "May":
            return "05"
        if name == "Jun":
            return "06"
        if name == "Jul":
            return "07"
        if name == "Aug":
            return "08"
        if name == "Sep":
            return "09"
        if name == "Oct":
            return "10"
        if name == "Nov":
            return "11"
        if name == "Dec":
            return "12"

    def _get_time(self, name):
        if name == "00:00":
            return "0000"
        else:
            return "1200"

    def _get_range(self, name):
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

    def _get_maps(self):
        response = self._get_data()
        soup = bs(response.content, "html.parser")
        maps = []

        for rows in soup.find_all(id="bwCharts"):
            for row in list(rows.children):
                if isinstance(row, bs4.element.Tag):
                    label = row.attrs.get("id")
                    label = self._get_range(label)
                    date = row.attrs.get("data-value")

                    date_parts = date.split()

                    day = date_parts[4]
                    month_name = date_parts[5]
                    month = self._get_month(month_name)
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
                    label = self._get_range(label)
                    date = row.attrs.get("data-value")

                    date_parts = date.split()

                    day = date_parts[4]
                    month_name = date_parts[5]
                    month = self._get_month(month_name)
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

    def _download_map(self, map):
        year = map[1]
        month = map[2]
        day = map[3]
        time = map[4]
        time = self._get_time(time)

        url = map[0]
        event_type = map[6]

        date_url = str(year) + str(month).zfill(2) + str(day).zfill(2)
        name = 'pressure-map'

        log_data = LogData(date_url, name, event_type)
        log_data.set_time(time)

        file = RequestForecastFile()
        response = file.get_file(url)

        self.log.write_file(log_data, response)

    def get(self):
        map_items = self._get_maps()
        for map_item in map_items:
            self._download_map(map_item)
