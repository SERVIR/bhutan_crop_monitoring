import json
from collections import defaultdict
from pathlib import Path
import geopandas as gpd
from django.http import JsonResponse
from django.db.models import Sum
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


@csrf_exempt
def map(request):
    context = {}
    return render(request, 'WebApp/map.html', context)


def dashboard(request):
    dzongkhag_data = []
    try:
        country = Country.objects.get(country_id='BT')
        country_geometry = country.country_geometry

        # Query all Dzongkhags related to the specified country
        dzongkhags = Dzongkhag.objects.filter(country='BT')

        # # Extract geometries from Dzongkhags to display in UI

        for dzongkhag in dzongkhags:
            dzongkhag_data.append({'id': dzongkhag.dzongkhag_id, 'name': dzongkhag.dzongkhag_name,
                                   'geometry': dzongkhag.dzongkhag_geometry, })

    except Country.DoesNotExist:
        # Handle the case where the specified country_id does not exist
        country_geometry = None

    data_layers = DataLayer.objects.all()

    # Pass the country_geometry in the context
    context = {'dzongkhags': dzongkhag_data, 'data_layers': data_layers, 'boundary': get_menu_data(),
               'full_data': all_dzongkhag_data()}

    return render(request, 'WebApp/dashboard.html', context)


def all_dzongkhag_data():
    # Get all Dzongkhags
    dzongkhags = Dzongkhag.objects.all().order_by('dzongkhag_name')

    # Dictionary to store results for each Dzongkhag
    results = {}
    # Add Bhutan climate variables
    results["temperature"] = [{"year": 2016, "val": 10.71}, {"year": 2017, "val": 10.66}, {"year": 2018, "val": 10.27},
                              {"year": 2019, "val": 10.51}, {"year": 2020, "val": 10.34}, {"year": 2021, "val": 10.73},
                              {"year": 2022, "val": 10.56}]
    results["precipitation"] = [{"year": 2016, "val": 1861.7}, {"year": 2017, "val": 1992.03},
                                {"year": 2018, "val": 1548.15}, {"year": 2019, "val": 1760.3},
                                {"year": 2020, "val": 2047.88}, {"year": 2021, "val": 1594.15},
                                {"year": 2022, "val": 1656.23}]
    results["ndvi"] = [{"year": 2016, "val": 0.34}, {"year": 2017, "val": 0.339}, {"year": 2018, "val": 0.307},
                       {"year": 2019, "val": 0.321}, {"year": 2020, "val": 0.302}, {"year": 2021, "val": 0.318},
                       {"year": 2022, "val": 0.082}]
    results["soil_moisture"] = [{"year": 2016, "val": 18.766}, {"year": 2017, "val": 18.199},
                                {"year": 2018, "val": 18.013}, {"year": 2019, "val": 19.332},
                                {"year": 2020, "val": 18.061}, {"year": 2021, "val": 16.431},
                                {"year": 2022, "val": 19.448}]

    # Loop through each Dzongkhag
    for dzongkhag in dzongkhags:
        # Dictionary to store values for each year
        yearly_data = defaultdict(dict)

        # Loop through each year from 2016 to 2022
        for year in range(2016, 2023):
            # Fetch the values for each attribute for the current year
            yearly_data[year]['average_rice'] = AverageRice.objects.filter(dzongkhag=dzongkhag, year=year).values_list(
                'value', flat=True)
            yearly_data[year]['paddy_gain'] = PaddyGain.objects.filter(dzongkhag=dzongkhag, year=year).values_list(
                'value', flat=True)
            yearly_data[year]['paddy_loss'] = PaddyLoss.objects.filter(dzongkhag=dzongkhag, year=year).values_list(
                'value', flat=True)
            yearly_data[year]['ndvi'] = NDVI.objects.filter(dzongkhag=dzongkhag, year=year).values_list('value',
                                                                                                        flat=True)
            yearly_data[year]['precipitation'] = Precipitation.objects.filter(dzongkhag=dzongkhag,
                                                                              year=year).values_list('value', flat=True)
            yearly_data[year]['soil_moisture'] = SoilMoisture.objects.filter(dzongkhag=dzongkhag,
                                                                             year=year).values_list('value', flat=True)
            # yearly_data[year]['temperature'] = Temperature.objects.filter(dzongkhag=dzongkhag, year=year).values_list(
            #     'value', flat=True)
            yearly_data[year]['rice_distribution'] = RiceDistribution.objects.filter(dzongkhag=dzongkhag,
                                                                                     year=year).values_list('value',
                                                                                                            flat=True)

            # Store the yearly data for the current Dzongkhag
        results[dzongkhag.dzongkhag_name] = yearly_data

    return json.dumps(results, default=list)


def get_menu_data():
    menu_data = {'Countries': {}}

    # Query all countries
    countries = Country.objects.all()
    for country in countries:
        country_data = {}
        country_data['name'] = country.country_name
        country_data['country_id'] = country.country_id

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


def about(request):
    return render(request, 'WebApp/about.html', {})


@xframe_options_exempt
def feedback(request):
    return render(request, 'WebApp/feedback.html', {})
