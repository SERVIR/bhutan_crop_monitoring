from django.core.management.base import BaseCommand
from WebApp.models import *
import pandas as pd
import json
import requests
import time


class Command(BaseCommand):
    help = 'Load Dzongkhag temp data'

    def handle(self, *args, **kwargs):
        # df = pd.read_excel("/servir_apps/gewog_climo_2000_2023.xlsx")
        df = pd.read_excel("d:\\gewog_climo_2000_2023.xlsx")

        for index, row in df.iterrows():
            dzongkhag_name = row['NAME_1']
            gewog_name = row['NAME_2']

            dzongkhag = Dzongkhag.objects.get(dzongkhag_name=dzongkhag_name)
            gewog, _ = Gewog.objects.get_or_create(gewog_name=gewog_name, dzongkhag=dzongkhag)

            Tmax = row['Tmax']
            Tmin = row['Tmin']
            year = row['Year']
            month = row['Month']

            # Check if Precipitation instance already exists for this year, month, and dzongkhag
            try:
                temperature, created = Temperature.objects.get_or_create(year=year, month=month, gewog=gewog,
                                                                         defaults={'max': Tmax, 'min': Tmin})
                if not created:
                    # Update the existing Precipitation instance
                    temperature.min = Tmin
                    temperature.max = Tmax
                    temperature.save()
            except Temperature.DoesNotExist:
                # Create a new Precipitation instance
                temperature = Temperature.objects.create(
                    year=year,
                    month=month,
                    gewog=gewog,
                    min=Tmin,
                    max=Tmax
                )

        self.stdout.write(self.style.SUCCESS('Dzongkhag yield data loaded successfully!'))
