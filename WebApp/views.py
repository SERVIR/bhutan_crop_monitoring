import json
from pathlib import Path
import geopandas as gpd

from django.shortcuts import render
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.decorators.csrf import csrf_exempt
from WebApp.models import Gewog, Dzongkhag, Country

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
    try:
        country = Country.objects.get(country_id='BT')
        country_geometry = country.country_geometry

        # Query all Dzongkhags related to the specified country
        dzongkhags = Dzongkhag.objects.filter(country='BT')

        # # Extract geometries from Dzongkhags
        # dzongkhag_geometries = [dzongkhag.dzongkhag_geometry for dzongkhag in dzongkhags]
        dzongkhag_data = []
        for dzongkhag in dzongkhags:
            dzongkhag_data.append({'id': dzongkhag.dzongkhag_id, 'name': dzongkhag.dzongkhag_name,
                                   'geometry': dzongkhag.dzongkhag_geometry, })

    except Country.DoesNotExist:
        # Handle the case where the specified country_id does not exist
        country_geometry = None

        # Pass the country_geometry in the context
    context = {'dzongkhags': dzongkhag_data, 'data_layers': [
        {"hasVisualization": True, "ui_id": 'rice_', "title": "Rice Map", "url": "https://thredds.servirglobal.net/thredds/wms/agg/crop/bhutan/paddy.nc4?service=WMS&version=1.3.0&", "attribution": "BillyZ",
         "layers": "paddy", "default_style": "boxfill/paddy", "default_color_range": ".5,1", "overrange": "transparent",
         "belowrange": "transparent", "default_year": "2016", "default_on": True},
        {"hasVisualization": True, "ui_id": 'maize_', "title": "Maize Map", "url": "https://thredds.servirglobal.net/thredds/wms/agg/crop/bhutan/maize.nc4?service=WMS&version=1.3.0&", "attribution": "BillyZ 2",
         "layers": "maize", "default_style": "boxfill/maize", "default_color_range": ".5,1", "overrange": "transparent",
         "belowrange": "transparent", "default_year": "2016", "default_on": True},
        {"hasVisualization": True, "ui_id": 'crop_land_', "title": "Crop land extent ", "url": "https://csthredds.servirglobal.net/thredds/wms/Agg/ucsb-chirps_global_0.05deg_daily.nc4?service=WMS&version=1.3.0&", "attribution": "BillyZ 3",
         "layers": "precipitation_amount", "default_style": "boxfill/cape_surface", "default_color_range": "1,50", "overrange": "extend",
         "belowrange": "extend", "default_year": "2016", "default_on": False},{"hasVisualization": True, "ui_id": 'average_precipitation_', "title": "Average Precipitation", "url": "https://thredds.servirglobal.net/thredds/wms/agg/crop/global/ucsb-chirps_global_0.05deg_1d_monthly_avg.nc4?service=WMS&version=1.3.0&", "attribution": "BillyZ 3",
         "layers": "precipitation_monthly_avg", "default_style": "boxfill/cape_surface", "default_color_range": "1,40", "overrange": "transparent",
         "belowrange": "transparent", "default_year": "2016", "default_month": "01", "default_on": False}]}

    return render(request, 'WebApp/dashboard.html', context)


def about(request):
    return render(request, 'WebApp/about.html', {})


@xframe_options_exempt
def feedback(request):
    return render(request, 'WebApp/feedback.html', {})
