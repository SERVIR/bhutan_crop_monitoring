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
    except Country.DoesNotExist:
        # Handle the case where the specified country_id does not exist
        country_geometry = None

        # Pass the country_geometry in the context
    context = {
        'country_geometry': country_geometry
    }

    return render(request, 'WebApp/dashboard.html', context)

def about(request):
    return render(request, 'WebApp/about.html', {})


@xframe_options_exempt
def feedback(request):
    return render(request, 'WebApp/feedback.html', {})

