from signalk.client import Client
import math
from datetime import datetime
import time
from sense_hat import SenseHat

sense = SenseHat()
sense.low_light = True

def convertradtodeg(rad):
    return round(180 * rad / math.pi)


def getsignalkdata():
    signals = []
    vessel = SK_CLIENT.data.get_vessels()
    name = vessel[0].name
    signals.append(vessel[0].get_datum('environment.depth.belowTransducer').value)
    signals.append(vessel[0].get_datum('environment.wind.speedTrue').value)
    signals.append(convertradtodeg(vessel[0].get_datum('environment.wind.directionTrue').value))
    signals.append(convertradtodeg(vessel[0].get_datum('environment.wind.angleApparent').value))
    signals.append(convertradtodeg(vessel[0].get_datum('navigation.courseOverGroundMagnetic').value))
    signals.append(convertradtodeg(vessel[0].get_datum('navigation.headingMagnetic').value))
    position = vessel[0].get_datum('navigation.position').display_value()
    cords = position.split(',')
    lat = cords[0][0:10]
    long = cords[1][0:10]
    signals.append(lat)
    signals.append(long)

    return signals


def render(data, currentCycle):
    keys = data.keys()
    red = (255, 0, 0)
    yellow = (255, 255, 0)
    for x in range(7, 0, -1):
        for y in range(0, 8):
            w = x - 1
            colour = sense.get_pixel(w, y)
            """print(str(x) + ',' + str(y) + "," + str(colour))"""
            sense.set_pixel(x, y, colour)

    for y in range(0, 8):
        previousCycle = 0

        if currentCycle < 8:
            previousCycle = currentCycle + 1

        if currentCycle == 8:
            previousCycle = 1

        if previousCycle in keys:
            previousData = data[previousCycle][y]
            currentData = data[currentCycle][y]

            if previousData == currentData:
                colour = yellow

            if previousData != currentData:
                colour = red

            """print(str(1) + ',' + str(y) + "," + str(colour))"""
            sense.set_pixel(0, y, colour)

        if previousCycle not in keys:
            """print(str(1) + ',' + str(y) + "," + str(colour))"""
            sense.set_pixel(0, y, (0,0,255))


def ticker():
    data = {}
    for i in range(1, 10):
        for cycle in range(1, 9):
            data[cycle] = getsignalkdata()
            print(data)
            render(data, cycle)
            time.sleep(0.1)


def main():
    global SK_CLIENT
    SK_CLIENT = Client()
    ticker()
    SK_CLIENT.close()


if __name__ == "__main__":
    main()
