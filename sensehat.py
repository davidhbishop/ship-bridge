import json
import os
from datetime import datetime
from sense_hat import SenseHat
sense = SenseHat()

temperature = sense.get_temperature()
pressure = sense.get_pressure()
humidity = sense.humidity

humidity = round(humidity,2)
temperature = round(temperature, 2)
pressure = round(pressure, 2)

now = datetime.now()
date_folder = now.strftime("%Y%m%d")
time_string = now.strftime("%H%M")

pathname = 'data/forecast/' + date_folder
filename = pathname + '/' + time_string + '-sensehat.json'

data = {
    "humidity": humidity,
    "temperature": temperature,
    "pressure": pressure
}

print(filename)
print(data)

if not os.path.isdir(pathname):
    os.makedirs(pathname)

with open(filename, 'w') as outfile:
    json.dump(data, outfile)
