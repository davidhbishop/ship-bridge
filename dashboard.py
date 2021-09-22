from tides import process_tides
from forecast import process_forecast
from weather import process_weather

def main():
    process_tides()
    process_forecast()
#    process_weather()

if __name__ == "__main__":
    main()
