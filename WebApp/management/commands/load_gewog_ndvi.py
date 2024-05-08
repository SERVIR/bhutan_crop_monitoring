from django.core.management.base import BaseCommand
from WebApp.models import *
from collections import defaultdict
import json
import requests
import time


class Command(BaseCommand):
    help = 'Load Gewogg NDVI data'

    def add_gewog_ndvi_values(self, data, gewog):
        monthly_ndvi = defaultdict(list)

        # Iterate through the NDVI data and group values by month
        for entry in data['data']:
            month_year = (entry['month'], entry['year'])
            monthly_ndvi[month_year].append(entry['value']['avg'])

        # Calculate the average NDVI value for each month
        averaged_ndvi = {month_year: sum(values) / len(values) for month_year, values in monthly_ndvi.items()}

        # Save the averaged NDVI values to the database
        for (month, year), value in averaged_ndvi.items():
            ndvi_obj, created = NDVI.objects.get_or_create(
                year=year,
                month=month,
                gewog=gewog,  # Assuming "BT" is the country ID for Bhutan
                defaults={'value': value}
            )
            if not created:
                ndvi_obj.value = value
                ndvi_obj.save()

    def handle(self, *args, **kwargs):
        # Your logic to load Gewog NDVI data
        # Access Django DB, fetch data, and update entries for NDVI
        # Example:
        gewogs = Gewog.objects.all().order_by('gewog_name')
        for gewog in gewogs:
            self.submit_gewog_data_request(2002, 2022, 28, gewog)
            self.stdout.write(self.style.SUCCESS('Completed Gewog: {}'.format(gewog.gewog_id)))

        self.stdout.write(self.style.SUCCESS('Gewog NDVI data loaded successfully!'))

    def submit_gewog_data_request(self, begin_year, end_year, data_id, gewog):
        base_url = "https://climateserv.servirglobal.net/api/"
        submit_url = base_url + "submitDataRequest/"
        progress_url = base_url + "getDataRequestProgress/"
        data_url = base_url + "getDataFromRequest/"

        # Loop through each year
        for year in range(begin_year, end_year + 1):
            # Prepare parameters for the data request
            params = {
                "datatype": data_id,  # 38,  # soil moisture #28,  # NDVI datatype
                "ensemble": False,
                "begintime": f"01/01/{year}",
                "endtime": f"12/31/{year}",
                "intervaltype": 0,
                "operationtype": 5,
                "dateType_Category": "default",
                "isZip_CurrentDataType": False,
                "geometry": str(json.dumps({"type": "FeatureCollection", "features": [
                    {"type": "Feature", "properties": {}, "geometry": gewog.gewog_geometry}]})).replace(" ", "")
            }

            # Make the POST request to submit the data request
            response = requests.post(submit_url, data=params)

            if response.status_code == 200:
                # Handle the response data
                data = response.json()

            else:
                # Handle the error
                print('ErrorRRRRRRRRRR:', response.status_code)

            request_id = json.loads(response.text)[0]  # Extract the request ID
            print(f"Data request submitted for {year}. Request ID: {request_id}")

            # Check the progress of the data request
            while True:
                progress_response = requests.get(progress_url, params={"id": request_id})
                progress = json.loads(progress_response.text)[0]

                if progress == 100:  # Request is complete
                    print(f"Data request for {year} is complete.")
                    break
                elif progress == -1:  # Error occurred
                    print(f"Error occurred while processing data request for {year}.")
                    break

                time.sleep(10)  # Wait for 10 seconds before checking progress again

            # Retrieve the NDVI data
            data_response = requests.get(data_url, params={"id": request_id})
            ndvi_data = json.loads(data_response.text)
            self.add_gewog_ndvi_values(ndvi_data, gewog)
            print(f"NDVI data retrieved for {year}: {ndvi_data}")
