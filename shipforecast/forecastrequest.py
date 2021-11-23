import requests


class ForecastRequest:
    def __init__(self):
        self.session = requests.session()

    def get(self, url):
        response = self.session.get(url)
        return response

    def get_with_header(self, url, headers):
        response = self.session.get(url, headers=headers)
        return response
