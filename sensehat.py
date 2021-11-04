import json
from sense_hat import SenseHat

from config import write_data
from config import get_dates

def process_sensehat():
    sense = SenseHat()
    dates = get_dates()

    humidity = sense.humidity
    temperature = sense.temperature
    pressure = sense.pressure

    data = {
        "humidity": humidity,
        "temperature": temperature,
        "pressure": pressure
    }

    pathname = '/data/forecast/' + dates[0]['url']
    filename = pathname + '/' + time + '-sensehat.json'