import os
import json
from logdata import LogData


class LogManager():
    def write_data(self, log):
        pathname = self._check_folder(log.date)
        filename = pathname + '/' + log.get_time() + '-' + log.location_name.lower() + '-' + log.type.lower() + '.json'
        print(filename)
        with open(filename, 'w') as outfile:
            json.dump(log.data, outfile)

    def _check_folder(self, date_url):
        pathname = "../data/forecast/" + date_url
        if not os.path.isdir(pathname):
            os.makedirs(pathname)
        return pathname
