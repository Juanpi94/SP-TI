from datetime import datetime


def try_parse_date(date):
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d-%m-%y"):
        try:
            return datetime.strptime(date, fmt)
        except ValueError:
            pass
    return None
