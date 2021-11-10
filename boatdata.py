"""a signalk client"""

import argparse
import logging
from datetime import datetime
import os
import sys
import json

# Global Variables
SK_CLIENT = None
STDSCR = None

def process_boatdata():
    """main"""

    from signalk.client import Client

    global SK_CLIENT

    argparser = argparse.ArgumentParser(
        description="SignalK Client"
        )

    argparser.add_argument(
        'server',
        nargs='?',
        default=None,
        help='server to connect to',
        )

    argparser.add_argument(
        '-L', '--log-level',
        default="ERROR",
        help='debug level',
        )

    argparser.add_argument(
        '-D', '--log-file',
        default=None,
        help='log to file',
        )

    args = argparser.parse_args()

    # Setup Logging
    if args.log_file == None:
        log_stream = sys.stdout
    else:
        log_stream = open(args.log_file, "a")

    logging.basicConfig(
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        level=args.log_level,
        stream=log_stream,
        )

    SK_CLIENT = Client(args.server)

    signalk_data = {'signalk': 'data'}

    for vessel in sorted(SK_CLIENT.data.get_vessels()):
        print("Name: " + vessel.name)
        for path in vessel.get_targets():
            datum = vessel.get_datum(path)
            string_path = str(path)
            string_value = str(datum.value)
            print(string_path + ": " + string_value)

            signalk_data[string_path] = string_value


    now = datetime.now()
    date_folder = now.strftime("%Y%m%d")
    time_string = now.strftime("%H%M")

    pathname = 'data/forecast/' + date_folder
    filename = pathname + '/' + time_string + '-signalk.json'

    print(filename)
    print(signalk_data)

    if not os.path.isdir(pathname):
        os.makedirs(pathname)

    with open(filename, 'w') as outfile:
        json.dump(signalk_data, outfile)

    SK_CLIENT.close()

    logging.debug("signalk_client.Data closed...")


def main():
    process_boatdata()


if __name__ == "__main__":
    main()
