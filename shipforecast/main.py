from locationmanager import LocationManager
from sourcemanager import SourceManager
from forecasttidal import TidalForecast
from forecastweather import WeatherForecast
from Forecastdaylight import DaylightForecast
from forecastpressure import PressureForecast

locations_path = '../data/locations/ship-locations.json'
sources_path = '../data/sources/shop-sources.json'


def main():
    locations = LocationManager(locations_path)
    sources = SourceManager(sources_path)

    tidal = TidalForecast(sources.getByType('tidal'))
    weather = WeatherForecast(sources.getByType('weather'))
    daylight = DaylightForecast(sources.getByType('daylight'))
    pressure = PressureForecast(sources.getByType('pressure'))

    for location in locations.getItems():

        if location.has('tidal'):
            tidal.get(location)

        if location.has('weather'):
            weather.get(location)

        if location.has('daylight'):
            daylight.get(location)

    pressure.get()



if __name__ == "__main__":
    main()
