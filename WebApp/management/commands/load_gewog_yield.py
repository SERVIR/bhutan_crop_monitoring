from django.core.management.base import BaseCommand
from WebApp.models import *
import pandas as pd
import json
import requests
import time


class Command(BaseCommand):
    help = 'Load Gewog yield data'

    def handle(self, *args, **kwargs):
        # df = pd.read_excel(r'D:\Bhutan_Obs_Pred_variable_data_Gewog.xlsx')
        df = pd.read_excel(r'/servir_apps/Bhutan_Obs_Pred_variable_data_Gewog.xlsx')

        # Iterate over each row in the DataFrame
        for index, row in df.iterrows():
            dzongkhag_name = row['NAME_1']
            gewog_name = row['NAME_2']

            dzongkhag = Dzongkhag.objects.get(dzongkhag_name=dzongkhag_name)
            gewog, _ = Gewog.objects.get_or_create(gewog_name=gewog_name, dzongkhag=dzongkhag)

            if pd.notna(row['Obs_Rice_Yield (Kg/acre)']) and pd.notna(row['Pred_Rice_Yield(kg/acre)']):
                # Create or update RiceYield object for the Dzongkhag
                rice_yield, created = RiceYield.objects.get_or_create(
                    gewog=gewog,
                    year=row['Year'],  # Assuming 'Year' is the name of the column
                    defaults={'value': row['Obs_Rice_Yield (Kg/acre)'],
                              'predicted': row['Pred_Rice_Yield(kg/acre)']}
                )

                if not created:
                    rice_yield.value = row['Obs_Rice_Yield (Kg/acre)']
                    rice_yield.predicted = row['Pred_Rice_Yield(kg/acre)']
                    rice_yield.save()

        self.stdout.write(self.style.SUCCESS('Dzongkhag yield data loaded successfully!'))
