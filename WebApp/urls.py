from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path

import WebApp.views as views
from WebApp import api_handlers

urlpatterns = [
    path('', views.home, name='home'),
    path('map/', views.map, name='map'),
    path('about/', views.about, name='about'),
    path('feedback/', views.feedback, name='feedback'),


]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
