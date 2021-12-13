from forecast import Forecast
from requestforecastjson import RequestForecastJson
from logdata import LogData


class ForecastWeather(Forecast):

    def _get_data(self, location_name):
        url = self._get_url(location_name)
        request = RequestForecastJson()
        return request.get_json(url)

    def _get_url(self, location_name):
        url = self.source.url
        return url.replace('LOCATION', location_name)

    def _convert_min2hour(self, minutes):
        hours = int(minutes) / 60
        time = str(round(hours)) + ':00'
        length = len(time)
        if length == 4:
            time = '0' + time
        return time

    def get(self, location):
        data = self._get_data(location.get_key('weather'))

        if not data:
            print('Failed to get weather data for ' + location.get_name())
            return False

        periods = data['SiteRep']['DV']['Location']['Period']
        for period in periods:
            date = period['value']
            year = date[0:4]
            month = date[5:7]
            day = date[8:10]
            date_folder = str(year) + str(month) + str(day)
            datapoints = period['Rep']
            for datapoint in datapoints:
                time = datapoint['$']
                time_file = self._convert_min2hour(time)
                datapoint['type'] = 'datapoint'
                datapoint['time'] = time_file
                wind_gust = float(datapoint['G'])
                wind_speed = float(datapoint['S'])
                datapoint['G'] = str(round(wind_gust * 0.868976))  # Convert to knots
                datapoint['S'] = str(round(wind_speed * 0.868976))  # Convert to knots

                log_data = LogData(date_folder, location.get_name(), 'datapoint')
                log_data.set_time(time_file)
                log_data.set_data(datapoint)
                self.log.write_json(log_data)

