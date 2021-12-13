import requests


class RequestForecast:
    def __init__(self):
        self.session = requests.session()

    def get(self, url):
        response = self.session.get(url)
        return response

    def get_with_header(self, url, headers):
        response = self.session.get(url, headers=headers)
        return response

    def get_with_stream(self, url):
        response = requests.get(url, stream=True)
        return response
