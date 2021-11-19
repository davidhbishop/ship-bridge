import logging
from datetime import datetime
import os
import sys
import json
from signalk.client import Client
import math


# Global Variables
SK_CLIENT = None
STDSCR = None
METERS_PER_NAUTICAL_MILE = 1852
SECONDS_PER_HOUR = 60*60

def save_signalk():
    signalk_data = {}

    vessel = SK_CLIENT.data.get_vessels()
    for path in vessel[0].get_targets():
        datum = vessel[0].get_datum(path)
        string_path = str(path)
        string_value = str(datum.value)

        signalk_data[string_path] = string_value


    now = datetime.now()
    date_folder = now.strftime("%Y%m%d")
    time_string = now.strftime("%H%M")

    pathname = 'data/forecast/' + date_folder
    filename = pathname + '/' + time_string + '-boat-data.json'

    print(filename)

    if not os.path.isdir(pathname):
        os.makedirs(pathname)

    with open(filename, 'w') as outfile:
        json.dump(signalk_data, outfile)


def convertmeterstoknots(ms):
    return round(ms * SECONDS_PER_HOUR / METERS_PER_NAUTICAL_MILE)


def convertradtodeg(rad):
    return round(180 * rad / math.pi)


def save_log():
    vessel = SK_CLIENT.data.get_vessels()

    log = {}
    log['depth'] = vessel[0].get_datum('environment.depth.belowTransducer').value

    log['wind-speed'] = convertmeterstoknots(vessel[0].get_datum('environment.wind.speedTrue').value)
    log['wind-direction-true'] = convertradtodeg(vessel[0].get_datum('environment.wind.directionTrue').value)
    log['apparent-wind'] = convertradtodeg(vessel[0].get_datum('environment.wind.angleApparent').value)
    log['course-over-ground-true'] = convertradtodeg(vessel[0].get_datum('navigation.courseOverGroundTrue').value)
    log['course-over-ground-magnetic'] = convertradtodeg(vessel[0].get_datum('navigation.courseOverGroundMagnetic').value)
    log['heading-magnetic'] = convertradtodeg(vessel[0].get_datum('navigation.headingMagnetic').value)
    log['heading-true'] = convertradtodeg(vessel[0].get_datum('navigation.headingMagnetic').value)
    log['speed-through-water'] = convertmeterstoknots(vessel[0].get_datum('navigation.speedThroughWater').value)
    log['speed-over-ground'] = convertmeterstoknots(vessel[0].get_datum('navigation.speedOverGround').value)

    position = vessel[0].get_datum('navigation.position').display_value()
    cords = position.split(',')
    lat = cords[0][0:10]
    long = cords[1][0:10]
    log['latitude'] = lat
    log['longitude'] = long

    now = datetime.now()
    date_folder = now.strftime("%Y%m%d")
    time_string = now.strftime("%H%M")

    pathname = 'data/forecast/' + date_folder
    filename = pathname + '/' + time_string + '-boat-log.json'

    print(filename)
    print(log)

    if not os.path.isdir(pathname):
        os.makedirs(pathname)

    with open(filename, 'w') as outfile:
        json.dump(log, outfile)


def process_boatdata():
    global SK_CLIENT
    SK_CLIENT = Client('bella-heart:3000')

    save_signalk()
    save_log()

    SK_CLIENT.close()

def main():
    process_boatdata()


if __name__ == "__main__":
    main()
