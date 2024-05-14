from django.core.management.base import BaseCommand
from WebApp.models import *
import pandas as pd
import json
import requests
import time


class Command(BaseCommand):
    help = 'Load Dzongkhag yield data'

    def handle(self, *args, **kwargs):
        # df = pd.read_excel(r'D:\Bhutan_Obs_Pred_variable_data_Dzongkhog.xlsx')
        df = pd.read_excel(r'load_dzongkhag_yield.pyBhutan_Obs_Pred_variable_data_Dzongkhog.xlsx')

        # Iterate over each row in the DataFrame
        for index, row in df.iterrows():
            # Find the corresponding Dzongkhag
            dzongkhag = Dzongkhag.objects.get(dzongkhag_name=row['District'])  # Assuming 'District' is the name of the column

            if pd.notna(row['Obs_Rice_Yield (Kg/acres)']) and pd.notna(row['Predicted_rice_yield (kg/acres)']):
                # Create or update RiceYield object for the Dzongkhag
                rice_yield, created = RiceYield.objects.get_or_create(
                    dzongkhag=dzongkhag,
                    year=row['Year'],  # Assuming 'Year' is the name of the column
                    defaults={'value': row['Obs_Rice_Yield (Kg/acres)'],
                              'predicted': row['Predicted_rice_yield (kg/acres)']}
                )

                if not created:
                    rice_yield.value = row['Obs_Rice_Yield (Kg/acres)']
                    rice_yield.predicted = row['Predicted_rice_yield (kg/acres)']
                    rice_yield.save()

        # Calculate total yield for each year for the country
        total_yield_per_year = df.groupby('Year').sum()

        # Update RiceYield object for the country
        country = Country.objects.get(country_id='BT')  # Assuming 'BT' is the country ID
        for year, total_yield in total_yield_per_year.iterrows():
            RiceYield.objects.update_or_create(
                year=year,
                country=country,
                defaults={'value': total_yield['Obs_Rice_Yield (Kg/acres)'],
                          'predicted': total_yield['Predicted_rice_yield (kg/acres)']}
            )

        self.stdout.write(self.style.SUCCESS('Dzongkhag yield data loaded successfully!'))
