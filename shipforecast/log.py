import os
import json
from logdata import LogData
from tqdm import tqdm


class Log:
    def _check_folder(self, date_url):
        pathname = "../data/forecast/" + date_url
        if not os.path.isdir(pathname):
            os.makedirs(pathname)
        return pathname

    def _get_filename(self, log_data: LogData):
        pathname = self._check_folder(log_data.date)
        filename = pathname + '/' \
            + log_data.get_time() + '-' \
            + log_data.name.lower() + '-' \
            + log_data.event_type.lower() + '.json'

        print(filename)

        return filename

    def write_json(self, log_data: LogData):
        filename = self._get_filename(log_data)

        with open(filename, 'w') as outfile:
            json.dump(log_data.data, outfile)

    def write_file(self, log_data: LogData, response_file):
        filename = self._get_filename(log_data)

        # get the total file size
        file_size = int(response_file.headers.get("Content-Length", 0))

        # progress bar, changing the unit to bytes instead of iteration (default by tqdm)
        progress = tqdm(response_file.iter_content(1024),
                        f"Downloading {filename}",
                        total=file_size,
                        unit="B",
                        unit_scale=True,
                        unit_divisor=1024)

        with open(filename, "wb") as f:
            for data in progress.iterable:
                # write data read to the file
                f.write(data)
                # update the progress bar manually
                progress.update(len(data))



