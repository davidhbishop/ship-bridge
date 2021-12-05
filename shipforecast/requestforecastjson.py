import json
from requestforecast import RequestForecast


class RequestForecastJson(RequestForecast):
    def get_json(self, url):
        response = self.get(url)
        if response.status_code == 200:
            data = json.loads(response.text)
            return data
        else:
            return False

    def get_json_with_header(self, url, headers):
        response = self.get_with_header(url, headers)
        data = json.loads(response.text)
        return data
