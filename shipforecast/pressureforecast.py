from forecast import Forecast
from forecastrequest import ForecastRequest
import bs4.element
from bs4 import BeautifulSoup as bs

class PressureForecast(Forecast):

    def _get_data(self):
        url = self._get_url()
        request = ForecastRequest()
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

    def _get_range(name):
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
                    label = self.get_range(label)
                    date = row.attrs.get("data-value")

                    date_parts = date.split()

                    day = date_parts[4]
                    month_name = date_parts[5]
                    month = self.get_month(month_name)
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
                    label = self.get_range(label)
                    date = row.attrs.get("data-value")

                    date_parts = date.split()

                    day = date_parts[4]
                    month_name = date_parts[5]
                    month = self.get_month(month_name)
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
        time = get_time(time)

        url = map[0]
        label = map[6]

        pathname = 'data/forecast/' + str(year) + str(month).zfill(2) + str(day).zfill(2)
        filename = pathname + '/' + time + '-pressure-map-' + label + '.gif'

        self._download_file(pathname, filename, url)

    def _download_file(self, pathname, filename, url):
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
        progress = tqdm(response.iter_content(1024), f"Downloading {filename}", total=file_size, unit="B",
                        unit_scale=True,
                        unit_divisor=1024)
        with open(filename, "wb") as f:
            for data in progress.iterable:
                # write data read to the file
                f.write(data)
                # update the progress bar manually
                progress.update(len(data))

    def get(self):
        maps = self._get_maps()

