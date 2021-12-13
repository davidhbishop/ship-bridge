from forecast import Forecast
from requestforecast import RequestForecast
from logdata import LogData
from sevendays import SevenDays
import bs4.element
from bs4 import BeautifulSoup as bs


class ForecastDaylight(Forecast):

    def _get_data(self, location_name, date):
        url = self._get_url(location_name, date)
        request = RequestForecast()
        return request.get(url)

    def _get_url(self, location_name, date):
        url = self.source.url
        url = url.replace('LOCATION', location_name)
        return url.replace('DATE', date['url'])

    def get(self, location):
        seven_days = SevenDays()
        dates = seven_days.get_dates()
        for date in dates:
            self._get_day(location.get_key('daylight'), date)

    def _get_day(self, location_name, date):
        response = self._get_data(location_name, date)

        soup = bs(response.content, "html.parser")

        universe = self._get_universe(soup)

        for movement in universe:
            log_data = LogData(date['url'], location_name, movement['type'])
            log_data.set_time(movement['time'])
            log_data.set_data(movement)
            self.log.write_json(log_data)

    def _get_universe(self, soup):
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
                            moon['graphic'] = str(moon_graphic)

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
                        moon['phase'] = moon_phase

        universe.append(moon)

        return universe

