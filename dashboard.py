from datetime import datetime
from datetime import timedelta
import os

def get_date(target):
    date = {
        "year": target.strftime("%Y"),
        "month": target.strftime("%m"),
        "day": target.strftime("%d"),
        "url": target.strftime("%Y%m%d")
    }
    return date


def get_dates():
    dates = []
    now = datetime.now()
    for i in range(0, 14):
        target = now + timedelta(days=i)
        date = get_date(target)
        dates.append(date)
    return dates


def create_folder(date, location):
    pathname = 'data/' + date + '/' + location
    if not os.path.isdir(pathname):
        os.makedirs(pathname)


def main():
    dates = get_dates()
    locations = {"conwy"}

    for date in dates:
        for location in locations:
            create_folder(date['url'],location)




if __name__=="__main__":
    main()