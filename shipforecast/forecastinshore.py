from forecast import Forecast
from requestforecast import RequestForecast
import bs4.element
from bs4 import BeautifulSoup as bs
from logdata import LogData
from datetime import datetime
from datetime import timedelta
from pprint import pprint

class ForecastInshore(Forecast):

    def _get_data(self):
        url = self._get_url()
        request = RequestForecast()
        return request.get(url)

    def _get_url(self):
        url = self.source.url
        return url

    def get_forecasts(self):
        response = self._get_data()
        soup = bs(response.content, "html.parser")

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

        forecasts = [summary]

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

    def _save_forecast(self, forecast, date, index):
        log_data = LogData(date, "inshore-forecast", str(index))
        log_data.set_time("00:00")

        #Add forecast[0] with additional values

        today = {
            "area": forecast["area"],
            "warning": forecast["warning"],
            "forecast": forecast["forecast"][0]
        }

        log_data.set_data(today)
        self.log.write_json(log_data)

    def _save_outlook(self, outlook, date, area):
        log_data = LogData(date, "inshore-outlook", str(area))
        log_data.set_time("00:00")
        log_data.set_data(forecast)
        #Add outlook (forecast[1]) if set with additional values
        self.log.write_json(log_data)

    def get(self):
        now = datetime.now()
        today_date = now.strftime("%Y%m%d")

        tomorrow_time = now + timedelta(days=1)
        tomorrow_date = tomorrow_time.strftime("%Y%m%d")

        areas = self.get_forecasts()
        index = 0
        for area in areas:
         if index > 0:
#           pprint(area["area"])
           self._save_forecast(area, today_date, index)
         index = index + 1;
