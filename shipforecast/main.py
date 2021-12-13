from locationmanager import LocationManager
from sourcemanager import SourceManager
from forecasttidal import TidalForecast
from forecastweather import ForecastWeather
from Forecastdaylight import ForecastDaylight
from forecastpressure import ForecastPressure

locations_path = '../data/locations/ship-locations.json'
sources_path = '../data/sources/ship-sources.json'


def main():
    locations = LocationManager(locations_path)
    sources = SourceManager(sources_path)

    tidal = TidalForecast(sources.getByType('tidal'))
    weather = ForecastWeather(sources.getByType('weather'))
    daylight = ForecastDaylight(sources.getByType('daylight'))
    pressure = ForecastPressure(sources.getByType('pressure'))


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
