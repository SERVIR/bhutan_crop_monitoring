import json
import logging
from collections import defaultdict
from pathlib import Path
import pandas as pd
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.decorators.csrf import csrf_exempt

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
    results = {"temperature": [{"year": temperature.year, "val": temperature.value} for temperature in
                               Temperature.objects.filter(country=country)],
               "precipitation": [{"year": precipitation.year, "val": precipitation.value} for precipitation in
                                 Precipitation.objects.filter(country=country)],
               "ndvi": [{"year": ndvi_instance.year, "val": ndvi_instance.value} for ndvi_instance in
                        NDVI.objects.filter(country=country)],
               "soil_moisture": [{"year": soil_moisture.year, "val": soil_moisture.value} for soil_moisture in
                                 SoilMoisture.objects.filter(country=country)],
               "paddy_gain": [{"year": paddy_gain.year, "val": paddy_gain.value} for paddy_gain in
                              PaddyGain.objects.filter(country=country)],
               "paddy_loss": [{"year": paddy_loss.year, "val": -1 * abs(paddy_loss.value)} for paddy_loss in
                              PaddyLoss.objects.filter(country=country)]}
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
        "precipitation": list({"year": precipitation.year, "val": precipitation.value} for precipitation in
                              Precipitation.objects.filter(gewog=gewog).values('year', 'value')),
        "ndvi": list({"year": ndvi_instance['year'], "val": ndvi_instance['value']} for ndvi_instance in
                     NDVI.objects.filter(gewog=gewog).values('year', 'value')),
        "soil_moisture": list({"year": soil_moisture['year'], "val": soil_moisture['value']} for soil_moisture in
                              SoilMoisture.objects.filter(gewog=gewog).values('year', 'value')),
        "paddy_gain": list({"year": paddy_gain['year'], "val": paddy_gain['value']} for paddy_gain in
                           PaddyGain.objects.filter(gewog=gewog).values('year', 'value')),
        "paddy_loss": list({"year": paddy_loss['year'], "val": -1 * abs(paddy_loss['value'])} for paddy_loss in
                           PaddyLoss.objects.filter(gewog=gewog).values('year', 'value'))
    }

    return JsonResponse(results)


@csrf_exempt
def get_dzongkhag_data(self, dzongkhag_id):

    # Get the dzongkhag instance
    dzongkhag = Dzongkhag.objects.get(dzongkhag_id=dzongkhag_id)

    # Retrieve variable instances associated with the dzongkhag
    results = {
        "temperature": list({"year": temperature.year, "val": temperature.value} for temperature in
                             Temperature.objects.filter(dzongkhag=dzongkhag).values('year', 'value')),
        "precipitation": list({"year": precipitation.year, "val": precipitation.value} for precipitation in
                               Precipitation.objects.filter(dzongkhag=dzongkhag).values('year', 'value')),
        "ndvi": list({"year": ndvi_instance['year'], "val": ndvi_instance['value']} for ndvi_instance in
                     NDVI.objects.filter(dzongkhag=dzongkhag).values('year', 'value')),
        "soil_moisture": list({"year": soil_moisture['year'], "val": soil_moisture['value']} for soil_moisture in
                               SoilMoisture.objects.filter(dzongkhag=dzongkhag).values('year', 'value')),
        "paddy_gain": list({"year": paddy_gain['year'], "val": paddy_gain['value']} for paddy_gain in
                            PaddyGain.objects.filter(dzongkhag=dzongkhag).values('year', 'value')),
        "paddy_loss": list({"year": paddy_loss['year'], "val": -1 * abs(paddy_loss['value'])} for paddy_loss in
                            PaddyLoss.objects.filter(dzongkhag=dzongkhag).values('year', 'value'))
    }

    # Add gewog-wise data
    gewogs = Gewog.objects.filter(dzongkhag__dzongkhag_id=dzongkhag_id).order_by('gewog_name')

    # Loop through each gewog
    for gewog in gewogs:
        yearly_data = {}

        # Loop through each year from 2016 to 2022
        for year in range(2016, 2023):
            # Fetch the values for each attribute for the current year
            yearly_data[year] = {
                'average_rice': list(AverageRice.objects.filter(gewog=gewog, year=year).values_list('value', flat=True)),
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
    # Load the Excel file
    df = pd.read_excel("C:\\Users\\washmall\\Documents\\websites\\bhutan_crop_monitoring\\WebApp\\Bhutan_Obs_Pred_variable_data.xlsx")

    # Iterate over rows
    for index, row in df.iterrows():
        year = row['Year']
        obs_rice_area = row['Obs_Rice_Area (Acres)']
        dzongkhag_name = row['District']

        # Find the Dzongkhag object by name
        dzongkhag = Dzongkhag.objects.get(dzongkhag_name=dzongkhag_name)

        # Update or create AverageRice object
        average_rice, created = AverageRice.objects.update_or_create(
            dzongkhag=dzongkhag,
            year=year,
            defaults={'value': obs_rice_area}
        )

        if created:
            print(f'AverageRice entry created for {dzongkhag_name} in {year}')
        else:
            print(f'AverageRice entry updated for {dzongkhag_name} in {year}')



def about(request):
    return render(request, 'WebApp/about.html', {})


@xframe_options_exempt
def feedback(request):
    return render(request, 'WebApp/feedback.html', {})
