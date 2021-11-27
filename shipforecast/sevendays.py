from datetime import timedelta
from datetime import datetime


class SevenDays:
    def __init__(self):
        self.dates = []
        now = datetime.now()
        for i in range(0, 7):
            target = now + timedelta(days=i)
            date = self._get_date(target)
            self.dates.append(date)

    def _get_date(self, target):
        date = {
            "year": target.strftime("%Y"),
            "month": target.strftime("%m"),
            "day": target.strftime("%d"),
            "url": target.strftime("%Y%m%d")
        }
        return date

    def get_dates(self):
        return self.dates
