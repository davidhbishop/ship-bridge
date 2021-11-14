from tidetimes import process_times
from metoffice import process_metoffice
from metofficedata import process_metofficedata
from admiraltytidal import process_tidal
from sensehat import process_sensehat
from boatdata import process_boatdata

def main():
    process_tidal()
    process_times()
    process_metoffice()
    process_metofficedata()
    process_sensehat()
    process_boatdata() 

if __name__ == "__main__":
    main()
