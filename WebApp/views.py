import datetime
import requests
import json
import time
import logging
from collections import defaultdict
from pathlib import Path
import pandas as pd
import geopandas as gpd
from django.db.models import Sum
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.decorators.csrf import csrf_exempt
from numpy import isnan

from WebApp.models import *

# Build paths inside the project like this: BASE_DIR / 'subdir'.

BASE_DIR = Path(__file__).resolve().parent.parent
f = open(str(BASE_DIR) + '/data.json', )
data = json.load(f)


def home(request):
    context = {}

    return render(request, 'WebApp/home.html', context)


def dashboard(request):
    dzongkhag_data = []
    try:

        # Query all Dzongkhags related to the specified country
        dzongkhags = Dzongkhag.objects.filter(country='BT').order_by('dzongkhag_name')

        # # Extract geometries from Dzongkhags to display in UI

        for dzongkhag in dzongkhags:
            dzongkhag_data.append({'id': dzongkhag.dzongkhag_id, 'name': dzongkhag.dzongkhag_name,
                                   'geometry': dzongkhag.dzongkhag_geometry, })

    except Country.DoesNotExist:
        # Handle the case where the specified country_id does not exist
        logging.log("We only have one Country, this should never happen")

    data_layers = DataLayer.objects.all()

    # Pass the country_geometry in the context
    context = {'dzongkhags': dzongkhag_data, 'data_layers': data_layers, 'boundary': get_menu_data(),
               'full_data': get_country_data("BT")}

    return render(request, 'WebApp/dashboard.html', context)


def get_country_data(country_id):
    country = Country.objects.get(country_id=country_id)

    # Retrieve variable instances associated with the country
    results = {"temperature": [{"x": convert_to_milliseconds(str(temperature.year) + "/" + str(temperature.month).zfill(2)),
                    "val": temperature.value, "min": temperature.min, "max": temperature.max} for temperature in
                               Temperature.objects.filter(country=country).order_by('year', 'month')],
               "precipitation": [
                   {"x": convert_to_milliseconds(str(precipitation.year) + "/" + str(precipitation.month).zfill(2)),
                    "val": precipitation.value} for precipitation in
                   Precipitation.objects.filter(country=country).order_by('year', 'month')],
               "ndvi": [ {"x": convert_to_milliseconds(str(ndvi_instance.year) + "/" + str(ndvi_instance.month).zfill(2)),
                    "val": ndvi_instance.value}  for ndvi_instance in
                        NDVI.objects.filter(country=country)],
               "soil_moisture": [{"x": convert_to_milliseconds(str(soil_moisture.year) + "/" + str(soil_moisture.month).zfill(2)),
                    "val": soil_moisture.value} for soil_moisture in
                                 SoilMoisture.objects.filter(country=country).order_by('year', 'month')],
               "paddy_gain": [{"year": convert_to_milliseconds(str(paddy_gain.year)), "val": paddy_gain.value} for paddy_gain in
                              PaddyChangeFrom2008.objects.filter(country=country).order_by('year')],
               "paddy_loss": [{"year": convert_to_milliseconds(str(paddy_loss.year)), "val": -1 * abs(paddy_loss.value)} for paddy_loss in
                              PaddyChangeFrom2020.objects.filter(country=country).order_by('year')]}
    # Add Country climate variables

    # Get all Dzongkhags
    dzongkhags = Dzongkhag.objects.all().order_by('dzongkhag_name')

    # Loop through each Dzongkhag
    for dzongkhag in dzongkhags:
        # Dictionary to store values for each year
        yearly_data = defaultdict(dict)

        # Loop through each year from 2002 to 2022
        for year in range(2002, 2023):
            # Fetch the values for each attribute for the current year
            yearly_data[year]['average_rice'] = AverageRice.objects.filter(dzongkhag=dzongkhag, year=year).values_list(
                'value', flat=True)
            yearly_data[year]['rice_distribution'] = RiceDistribution.objects.filter(dzongkhag=dzongkhag,
                                                                                     year=year).values_list('value',
                                                                                                            flat=True)

            # Store the yearly data for the current Dzongkhag
        results[dzongkhag.dzongkhag_name] = yearly_data

    return json.dumps(results, default=list)


@csrf_exempt
def get_gewog_data(self, gewog_id):
    gewog = Gewog.objects.get(pk=gewog_id)

    # Retrieve variable instances associated with the gewog
    results = {
        "temperature": list({"year": temperature.year, "val": temperature.value} for temperature in
                            Temperature.objects.filter(gewog=gewog).values('year', 'value')),
        "precipitation": [
            {"x": convert_to_milliseconds(str(precipitation["year"]) + "/" + str(precipitation["month"]).zfill(2)),
             "val": precipitation["value"]} for precipitation in
            Precipitation.objects.filter(gewog=gewog).values('year', 'month', 'value')],
        "ndvi": list({"year": ndvi_instance['year'], "val": ndvi_instance['value']} for ndvi_instance in
                     NDVI.objects.filter(gewog=gewog).values('year', 'value')),
        "soil_moisture": list({"year": soil_moisture['year'], "val": soil_moisture['value']} for soil_moisture in
                              SoilMoisture.objects.filter(gewog=gewog).values('year', 'value')),
        "paddy_gain": list({"year": convert_to_milliseconds(str(paddy_gain['year'])), "val": paddy_gain['value']} for paddy_gain in
                           PaddyChangeFrom2008.objects.filter(gewog=gewog).values('year', 'value')),
        "paddy_loss": list({"year": convert_to_milliseconds(str(paddy_loss['year'])), "val": paddy_loss['value']} for paddy_loss in
                           PaddyChangeFrom2020.objects.filter(gewog=gewog).values('year', 'value'))
    }

    return JsonResponse(results)


def convert_to_milliseconds(date_str):
    if len(date_str) > 4:
        date_obj = datetime.datetime.strptime(date_str, "%Y/%m")
    else:
        date_obj = datetime.datetime.strptime(date_str, "%Y")
    # Convert the datetime object to milliseconds since the UNIX epoch
    return int(date_obj.timestamp() * 1000)


@csrf_exempt
def get_dzongkhag_data(self, dzongkhag_id):
    # Get the dzongkhag instance
    dzongkhag = Dzongkhag.objects.get(dzongkhag_id=dzongkhag_id)

    # Retrieve variable instances associated with the dzongkhag
    results = {
        "temperature": list({"year": temperature.year, "val": temperature.value} for temperature in
                            Temperature.objects.filter(dzongkhag=dzongkhag).values('year', 'value')),
        "precipitation": [
                   {"x": convert_to_milliseconds(str(precipitation["year"]) + "/" + str(precipitation["month"]).zfill(2)),
                    "val": precipitation["value"]} for precipitation in
            Precipitation.objects.filter(dzongkhag=dzongkhag).values('year', 'month', 'value')],
        "ndvi": list({"year": ndvi_instance['year'], "val": ndvi_instance['value']} for ndvi_instance in
                     NDVI.objects.filter(dzongkhag=dzongkhag).values('year', 'value')),
        "soil_moisture": list({"year": soil_moisture['year'], "val": soil_moisture['value']} for soil_moisture in
                              SoilMoisture.objects.filter(dzongkhag=dzongkhag).values('year', 'value')),
        "paddy_gain": list({"year": convert_to_milliseconds(str(paddy_gain['year'])), "val": paddy_gain['value']} for paddy_gain in
                           PaddyChangeFrom2008.objects.filter(dzongkhag=dzongkhag).values('year', 'value')),
        "paddy_loss": list({"year": convert_to_milliseconds(str(paddy_loss['year'])), "val": paddy_loss['value']} for paddy_loss in
                           PaddyChangeFrom2020.objects.filter(dzongkhag=dzongkhag).values('year', 'value'))
    }

    # Add gewog-wise data
    gewogs = Gewog.objects.filter(dzongkhag__dzongkhag_id=dzongkhag_id).order_by('gewog_name')

    available_years = AverageRice.objects.filter(gewog__dzongkhag=dzongkhag).values_list('year', flat=True).distinct()

    # Loop through each gewog
    for gewog in gewogs:
        yearly_data = {}

        # Loop through each year from 2016 to 2022
        for year in available_years:
            # Fetch the values for each attribute for the current year
            yearly_data[year] = {
                'average_rice': list(
                    AverageRice.objects.filter(gewog=gewog, year=year).values_list('value', flat=True)),
                'rice_distribution': list(RiceDistribution.objects.filter(gewog=gewog, year=year).values_list('value',
                                                                                                              flat=True))
            }

        results[gewog.gewog_name] = yearly_data

    return JsonResponse(results)


def get_menu_data():
    menu_data = {'Countries': {}}

    # Query all countries
    countries = Country.objects.all()
    for country in countries:
        country_data = {'name': country.country_name, 'country_id': country.country_id}

        # Query all dzongkhags for the current country
        dzongkhags = Dzongkhag.objects.filter(country=country).order_by('dzongkhag_name')
        dzongkhag_data = {}
        for dzongkhag in dzongkhags:
            dzongkhag_data[dzongkhag.dzongkhag_name] = {'name': dzongkhag.dzongkhag_name,
                                                        'dzongkhag_id': dzongkhag.dzongkhag_id, 'gewogs': []}

            # Query all gewogs for the current dzongkhag
            gewogs = Gewog.objects.filter(dzongkhag=dzongkhag).order_by('gewog_name')
            for gewog in gewogs:
                gewog_data = {'name': gewog.gewog_name, 'gewog_id': gewog.gewog_id}
                dzongkhag_data[dzongkhag.dzongkhag_name]['gewogs'].append(gewog_data)

        country_data['dzongkhags'] = dzongkhag_data
        menu_data['Countries'][country.country_name] = country_data
    return menu_data


def get_gewog_by_dzongkhag_id(request, dzongkhag_id):
    try:
        # Retrieve all gewogs associated with the provided dzongkhag_id
        gewogs = Gewog.objects.filter(dzongkhag__dzongkhag_id=dzongkhag_id)

        # Construct a list of dictionaries containing gewog data
        gewogs_data = []
        for gewog in gewogs:
            gewog_data = {'id': gewog.gewog_id, 'name': gewog.gewog_name, 'geometry': gewog.gewog_geometry}
            gewogs_data.append(gewog_data)

        return JsonResponse({'gewogs': gewogs_data})
    except Gewog.DoesNotExist:
        return JsonResponse({'error': 'No gewogs found for the provided dzongkhag_id'},
                            status=404)  # Handle other exceptions if needed


def load_data(request):
    print("hello")
    # load_PaddyChangeRiceArea()
    # load_Dzongkhags_precipitation()
    # load_gewog_precipitation()
    # load_Dzongkhags_precipitation()
    # load_ndvi_country()
    # load_country_precipitation()
    load_smap_country()
    return dashboard(request)


def add_ndvi_values(data):
    monthly_ndvi = defaultdict(list)

    # Iterate through the NDVI data and group values by month
    for entry in data['data']:
        month_year = (entry['month'], entry['year'])
        monthly_ndvi[month_year].append(entry['value']['avg'])

    # Calculate the average NDVI value for each month
    averaged_ndvi = {month_year: sum(values) / len(values) for month_year, values in monthly_ndvi.items()}

    # Save the averaged NDVI values to the database
    for (month, year), value in averaged_ndvi.items():
        ndvi_obj, created = SoilMoisture.objects.get_or_create(
            year=year,
            month=month,
            country_id="BT",  # Assuming "BT" is the country ID for Bhutan
            defaults={'value': value}
        )
        if not created:
            ndvi_obj.value = value
            ndvi_obj.save()


def submit_data_request(begin_year, end_year, data_id):
    base_url = "https://climateserv.servirglobal.net/api/"
    submit_url = base_url + "submitDataRequest/"
    progress_url = base_url + "getDataRequestProgress/"
    data_url = base_url + "getDataFromRequest/"

    # Loop through each year
    for year in range(begin_year, end_year + 1):
        # Prepare parameters for the data request
        params = {
            "datatype": data_id,  # 38,  # soil moisture #2,  # NDVI datatype
            "ensemble": False,
            "begintime": f"01/01/{year}",
            "endtime": f"12/31/{year}",
            "intervaltype": 0,
            "operationtype": 5,
            "dateType_Category": "default",
            "isZip_CurrentDataType": False,
            "layerid": "country",
            "featureids": "30"  # Country ID for Bhutan
        }

        # Make the POST request to submit the data request
        response = requests.post(submit_url, params=params)
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
        add_ndvi_values(ndvi_data)
        print(f"NDVI data retrieved for {year}: {ndvi_data}")

        # Save NDVI data to database (implement this part according to your Django models)


def load_smap_country():
    submit_data_request(2015, 2022, 38)
    print("loadNDVICountry")


def load_ndvi_country():
    submit_data_request(2002, 2024, 2)
    print("loadNDVICountry")

def load_gewog_precipitation():
    df = pd.read_excel("/servir_apps/gewog_climo_2000_2023.xlsx")
    for index, row in df.iterrows():
        dzongkhag_name = row['NAME_1']
        gewog_name = row['NAME_2']
        precipitation_value = row['Precipitation']
        year = row['Year']
        month = row['Month']

        dzongkhag = Dzongkhag.objects.get(dzongkhag_name=dzongkhag_name)
        gewog, _ = Gewog.objects.get_or_create(gewog_name=gewog_name, dzongkhag=dzongkhag)

        # Create or update Precipitation instance
        precipitation, _ = Precipitation.objects.update_or_create(
            year=year,
            month=month,
            gewog=gewog,
            value=precipitation_value
        )



def load_country_precipitation():
    df = pd.read_excel("/servir_apps/country_climo_2000_2023.xlsx")
    # df = pd.read_excel("d:\\country_climo_2000_2023.xlsx")
    country = Country.objects.get(country_id="BT")
    for index, row in df.iterrows():

        precipitation_value = row['Precipitation']
        year = row['Year']
        month = row['Month']

        # Check if Precipitation instance already exists for this year, month, and dzongkhag
        try:
            precipitation = Precipitation.objects.get(year=year, month=month, country=country)
            # Update the existing Precipitation instance
            precipitation.value = precipitation_value
            precipitation.save()
        except Precipitation.DoesNotExist:
            # Create a new Precipitation instance
            precipitation = Precipitation.objects.create(
                year=year,
                month=month,
                country=country,
                value=precipitation_value
            )


def load_Dzongkhags_precipitation():
    df = pd.read_excel("/servir_apps/district_climo_2000_2023.xlsx")
    for index, row in df.iterrows():
        dzongkhag_name = row['NAME_1']
        precipitation_value = row['Precipitation(m)']
        year = row['Year']
        month = row['Month']

        dzongkhag = Dzongkhag.objects.get(dzongkhag_name=dzongkhag_name)

        # Check if Precipitation instance already exists for this year, month, and dzongkhag
        try:
            precipitation = Precipitation.objects.get(year=year, month=month, dzongkhag=dzongkhag)
            # Update the existing Precipitation instance
            precipitation.value = precipitation_value
            precipitation.save()
        except Precipitation.DoesNotExist:
            # Create a new Precipitation instance
            precipitation = Precipitation.objects.create(
                year=year,
                month=month,
                dzongkhag=dzongkhag,
                value=precipitation_value
            )



    # # Iterate over each Dzongkhag
    # for dzongkhag in dzongkhags:
    #     # Fetch all associated Gewogs for the current Dzongkhag
    #     gewogs = dzongkhag.gewog_set.all()
    #
    #     # Dictionary to store the sum of Precipitation values for each year and month
    #     precipitation_sum = defaultdict(float)
    #
    #     # Iterate over each Gewog
    #     for gewog in gewogs:
    #         # Fetch Precipitation entries associated with the current Gewog
    #         precipitation_entries = Precipitation.objects.filter(gewog=gewog)
    #
    #         # Calculate the sum of Precipitation values for each year and month
    #         for entry in precipitation_entries:
    #             precipitation_sum[(entry.year, entry.month)] += entry.value
    #
    #     # Update the Precipitation entry for the current Dzongkhag with the calculated sum
    #     for (year, month), sum_value in precipitation_sum.items():
    #         # Check if the Precipitation entry already exists for the current year and month
    #         existing_entry = Precipitation.objects.filter(dzongkhag=dzongkhag, year=year, month=month).first()
    #
    #         if existing_entry:
    #             # Update the existing entry
    #             existing_entry.value = sum_value
    #             existing_entry.save()
    #         else:
    #             # Create a new entry if it doesn't exist
    #             Precipitation.objects.create(dzongkhag=dzongkhag, year=year, month=month, value=sum_value)



def load_PaddyChangeRiceArea():
    # Remove PaddyChangeFrom2008 instances for each Dzongkhag
    dzongkhags = Dzongkhag.objects.all()
    for dzongkhag in dzongkhags:
        PaddyChangeFrom2008.objects.filter(dzongkhag=dzongkhag).delete()

    # Remove PaddyChangeFrom2020 instances for each Dzongkhag
    for dzongkhag in dzongkhags:
        PaddyChangeFrom2020.objects.filter(dzongkhag=dzongkhag).delete()
    # df = pd.read_excel("D:\\Dzongkhas_variables.xlsx")
    df = pd.read_excel("/servir_apps/Dzongkhas_variables.xlsx")
    # Iterate over rows
    for index, row in df.iterrows():
        year = row['Year']
        # obs_rice_area = row['Obs_Rice_Area (Acres)']
        before_covid = row['ObservedChangeRiceArea_afterConstitution']
        after_covid = row['ObservedChangeRiceArea_afterCOVID']
        dzongkhag_name = row['District']

        after_covid = 0 if isnan(after_covid) else after_covid
        before_covid = 0 if isnan(before_covid) else before_covid

        # Find the Dzongkhag object by name
        dzongkhag = Dzongkhag.objects.get(dzongkhag_name=dzongkhag_name)

        # Update or create AverageRice object
        average_rice, created = PaddyChangeFrom2020.objects.update_or_create(
            dzongkhag=dzongkhag,
            year=year,
            defaults={'value': after_covid}
        )

        # Update or create AverageRice object
        average_rice, created = PaddyChangeFrom2008.objects.update_or_create(
            dzongkhag=dzongkhag,
            year=year,
            defaults={'value': before_covid}
        )

        if created:
            print(f'PaddyChangeFrom2008 entry created for {dzongkhag_name} in {year}')
        else:
            print(f'PaddyChangeFrom2008 entry updated for {dzongkhag_name} in {year}')
    gewogs = Gewog.objects.all()
    for gewog in gewogs:
        PaddyChangeFrom2008.objects.filter(gewog=gewog).delete()

    df = pd.read_excel("D:\\Gewog_variables.xlsx")
    # Iterate over rows
    for index, row in df.iterrows():
        year = row['Year']
        # obs_rice_area = row['Obs_Rice_Area (Acres)']

        after_covid = row['ObservedChangeRiceArea_afterCOVID']
        dzongkhag_name = row['NAME_1']
        gewog_name = row["NAME_2"]

        after_covid = 0 if isnan(after_covid) else after_covid

        # Find the Dzongkhag object by name
        dzongkhag = Dzongkhag.objects.get(dzongkhag_name=dzongkhag_name)
        gewog, _ = Gewog.objects.get_or_create(gewog_name=gewog_name, dzongkhag=dzongkhag)

        # Update or create AverageRice object
        average_rice, created = PaddyChangeFrom2020.objects.update_or_create(
            gewog=gewog,
            year=year,
            defaults={'value': after_covid}
        )

        # # Update or create AverageRice object
        # average_rice, created = PaddyChangeFrom2008.objects.update_or_create(
        #     gewog=gewog,
        #     year=year,
        #     defaults={'value': after_covid}
        # )

        if created:
            print(f'PaddyChangeFrom2008 entry created for {dzongkhag_name} in {year}')
        else:
            print(f'PaddyChangeFrom2008 entry updated for {dzongkhag_name} in {year}')



def load_ObservedChangeRiceArea():
    # df = pd.read_excel("D:\\Dzongkhas_variables.xlsx")
    df = pd.read_excel("/servir_apps/Dzongkhas_variables.xlsx")
    # Iterate over rows
    for index, row in df.iterrows():
        year = row['Year']
        # obs_rice_area = row['Obs_Rice_Area (Acres)']
        before_covid = row['PredictedChangeRiceYield_afterConstitution']
        after_covid = row['ObservedChangeRiceArea_afterCOVID']
        dzongkhag_name = row['District']

        after_covid = 0 if isnan(after_covid) else after_covid
        before_covid = 0 if isnan(before_covid) else before_covid

        # Find the Dzongkhag object by name
        dzongkhag = Dzongkhag.objects.get(dzongkhag_name=dzongkhag_name)

        # Update or create AverageRice object
        average_rice, created = PaddyChangeFrom2020.objects.update_or_create(
            dzongkhag=dzongkhag,
            year=year,
            defaults={'value': after_covid}
        )

        # Update or create AverageRice object
        average_rice, created = PaddyChangeFrom2008.objects.update_or_create(
            dzongkhag=dzongkhag,
            year=year,
            defaults={'value': before_covid}
        )

        if created:
            print(f'PaddyChangeFrom2008 entry created for {dzongkhag_name} in {year}')
        else:
            print(f'PaddyChangeFrom2008 entry updated for {dzongkhag_name} in {year}')


def fix_shapefile(request):
    # Path to the shapefile
    shapefile_path = '/servir_apps/temp_shp/Bhutan_districts.shp'
    # shapefile_path = 'C:\\Users\\washmall\\Documents\\bhutan_shapes\\Bhutan_districts.shp'

    # Country ID
    country_id = 'BT'

    # Read the shapefile using geopandas
    gdf = gpd.read_file(shapefile_path)

    # Iterate over each feature in the GeoDataFrame
    for index, row in gdf.iterrows():
        # Extract the relevant fields (ADM1_PCODE and ADM1_EN)
        dzongkhag_id = row['GID_1']
        dzongkhag_id = dzongkhag_id.split('.')[0][:2] + dzongkhag_id.split('.')[1].split('_')[0].zfill(3)
        dzongkhag_name = row['NAME_1']

        # Create or get the country object
        country, created = Country.objects.get_or_create(country_id=country_id)

        # Convert geometry to GeoJSON format
        geometry_json = row.geometry.__geo_interface__

        # Create a new Dzongkhag object
        dzongkhag, created = Dzongkhag.objects.get_or_create(
            dzongkhag_id=dzongkhag_id,
            defaults={'dzongkhag_name': dzongkhag_name, 'country': country, 'dzongkhag_geometry': geometry_json}
        )

    # this is for the Gewogs
    # Path to the new shapefile
    new_shapefile_path = '/servir_apps/temp_shp/Bhutan_gewog.shp'
    # new_shapefile_path = 'C:\\Users\\washmall\\Documents\\bhutan_shapes\\Gewog_Final\\Bhutan_gewog.shp'

    # Read the new shapefile using geopandas
    new_gdf = gpd.read_file(new_shapefile_path)

    # Iterate over each feature in the new GeoDataFrame
    for index, row in new_gdf.iterrows():
        # Extract the relevant fields (GID_2 and Name_2) from the new shapefile
        gewog_id = row['GID_2']
        gewog_name = row['NAME_2']

        # Extract the Dzongkhag ID from the new shapefile (GID_1)
        dzongkhag_id = row['GID_1']

        # Translate gewog_id to the desired format (BT00309)
        gewog_id = gewog_id.split('.')[0][:2] + gewog_id.split('.')[1].zfill(3) + gewog_id.split('.')[2].split('_')[
            0].zfill(2)

        # Translate dzongkhag_id to the desired format (BT003)
        dzongkhag_id = dzongkhag_id.split('.')[0][:2] + dzongkhag_id.split('.')[1].split('_')[0].zfill(3)

        # Find corresponding Dzongkhag using dzongkhag_id
        try:
            dzongkhag = Dzongkhag.objects.get(dzongkhag_id=dzongkhag_id)
        except Dzongkhag.DoesNotExist:
            # Handle case where Dzongkhag is not found
            continue

        # Convert geometry to GeoJSON format
        geometry_json = row.geometry.__geo_interface__

        # Try to find the Gewog with the same gewog_id in the database
        try:
            gewog = Gewog.objects.get(gewog_id=gewog_id)

            # Update existing Gewog
            gewog.gewog_name = gewog_name
            gewog.dzongkhag = dzongkhag
            gewog.gewog_geometry = geometry_json
            gewog.save()
        except Gewog.DoesNotExist:
            # Create new Gewog if it doesn't exist
            Gewog.objects.create(gewog_id=gewog_id, gewog_name=gewog_name, dzongkhag=dzongkhag,
                                 gewog_geometry=geometry_json)


def about(request):
    return render(request, 'WebApp/about.html', {})


@xframe_options_exempt
def feedback(request):
    return render(request, 'WebApp/feedback.html', {})
