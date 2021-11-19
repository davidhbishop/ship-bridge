from locationmanager import LocationManager
from sourcemanager import SourceManager
from tidalforecast import TidalForecast

locations_path = '../data/locations/locations.json'
sources_path = '../data/sources/sources.json'


def main():
    locations = LocationManager(locations_path)
    sources = SourceManager(sources_path)

    tidal = TidalForecast(sources.getByType('tidal'))

    for location in locations.getItems():
        if (location.has('tidal')):
            tidal.get(location)



if __name__ == "__main__":
    main()