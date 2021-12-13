from requestforecast import RequestForecast


class RequestForecastFile(RequestForecast):
    def get_file(self, url):
        response = self.get_with_stream(url)
        return response
