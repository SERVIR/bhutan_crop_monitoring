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
            dzongkhag_data.append({
                'id': dzongkhag.dzongkhag_id,
                'name': dzongkhag.dzongkhag_name,
                'geometry': dzongkhag.dzongkhag_geometry,
            })

    except Country.DoesNotExist:
        # Handle the case where the specified country_id does not exist
        country_geometry = None

        # Pass the country_geometry in the context
    context = {
        'dzongkhags': dzongkhag_data
    }

    return render(request, 'WebApp/dashboard.html', context)

def about(request):
    return render(request, 'WebApp/about.html', {})


@xframe_options_exempt
def feedback(request):
    return render(request, 'WebApp/feedback.html', {})

