from forecast import Forecast
from requestforecastjson import RequestForecastJson
from britishtimemanager import BritishTimeManager
from tidalgate import TidalGate
from logdata import LogData


class TidalForecast(Forecast):

    def _get_events(self, location_name):
        url = self._get_url(location_name)
        headers = self._get_headers()
        request = RequestForecastJson()
        return request.get_json_with_header(url, headers)

    def _get_url(self, location_name):
        url = self.source.url
        return url.replace('LOCATION', location_name)

    def _get_headers(self):
        headers = {'Ocp-Apim-Subscription-Key': self.source.key}
        return headers

    def get(self, location):
        if location.has('gate'):
            self.hasGate = True

        tide_events = self._get_events(location.get_key('tidal'))

        for tide_event in tide_events:

            tide_time = BritishTimeManager(tide_event['DateTime'])

            date_folder = tide_time.get_date()
            time = tide_time.get_time()

            event_type = tide_event['EventType']
            height = round(tide_event['Height'], 2)

            log_data = LogData(date_folder, location.get_name(), event_type)
            log_data.set_time(time)
            log_data.add_data('type', event_type)
            log_data.add_data('time', time)
            log_data.add_data('depth', height)
            self.log.write_json(log_data)

            if (event_type=='HighWater'):

                if self.hasGate:
                    gate = TidalGate(tide_time.date_time)

                    """Gate open time"""
                    gate.set_open_difference(location.get_gate_open())
                    log_data = LogData(gate.get_open_date(), location.get_name(), 'gateopen')
                    log_data.set_time(gate.get_open_time())
                    log_data.add_data('type', 'gateopen')
                    log_data.add_data('time', gate.get_open_time())
                    self.log.write_json(log_data)

                    """Gate close time"""
                    gate.set_close_difference(location.get_gate_close())
                    log_data = LogData(gate.get_close_date(), location.get_name(), 'gateclose')
                    log_data.set_time(gate.get_close_time())
                    log_data.add_data('type', 'gateclose')
                    log_data.add_data('time', gate.get_close_time())
                    self.log.write_json(log_data)
