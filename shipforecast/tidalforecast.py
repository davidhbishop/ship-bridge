from forecast import Forecast
import requests
import json
from timemanager import TimeManager
from logmanager import LogManager
from datetime import datetime

class TidalForecast(Forecast):

    def get(self, location):
        tm = TimeManager()
        lm = LogManager()

        if location.has('gate'):
            self.hasGate = True

        tide_events = self._get_data(location['tidal'])

        for tide_event in tide_events:
            date = tide_event['DateTime']
            year = date[0:4]
            month = date[5:7]
            day = date[8:10]
            hour = date[11:13]
            minute = date[14:16]

            #Convert from UTC to British Summer Time (if needed)
            tidetime_utc = datetime(int(year), int(month), int(day), int(hour), int(minute), 0)
            utc_timestamp = datetime.timestamp(tidetime_utc)
            utc_year = tidetime_utc.strftime("%Y")
            summer = tm.get_summer(utc_timestamp, utc_year)

            if summer == 'summer':
                tidetime = tidetime_utc + timedelta(hours=+1)
            else:
                tidetime = tidetime_utc

            #Corrected
            date_folder = tidetime.strftime("%Y%m%d")
            time = tidetime.strftime("%H:%M")

            event_type = tide_event['EventType']
            height = round(tide_event['Height'],2)
            event_data = {
                'type': event_type,
                'time': time,
                'depth': height
                }

            lm.write_data(date_folder, location['name'], time, event_type, event_data)
            if (event_type=='HighWater'):

                if open_diff == '-3':
                    gateopen = tidetime + timedelta(hours=-3)
                    date_url = gateopen.strftime("%Y%m%d")
                    opentime = gateopen.strftime("%H:%M")
                    type = 'gateopen'
                    opendata = {
                        'time': opentime,
                        'type': type
                    }
                    lm.write_data(date_url, location['name'], opentime, 'gateopen', opendata)

                if close_diff == '+3':
                    gateclose = tidetime + timedelta(hours=+3)
                    date_url = gateclose.strftime("%Y%m%d")
                    closetime = gateclose.strftime("%H:%M")
                    type = 'gateclose'
                    closedata = {
                        'time': closetime,
                        'type': type
                    }
                    lm.write_data(date_url, location['name'], closetime, 'gateclose', closedata)





    def _get_events(self, location_name):
        url = self._get_url(location_name)
        headers = self._get_headers()
        session = requests.session()
        response = session.get(url, headers)
        events = json.loads(response.text)
        return events

    def _get_url(self, url, location_name):
        url = self.source.url
        return url.replace('LOCATION',location_name)

    def _get_headers(self):
        headers = {'Ocp-Apim-Subscription-Key': self.source.key}
        return headers

    def save(self):
