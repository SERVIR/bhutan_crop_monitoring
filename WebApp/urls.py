from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path

import WebApp.views as views

urlpatterns = [
    path('', views.home, name='home'),
    path('map/', views.map, name='map'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('about/', views.about, name='about'),
    path('feedback/', views.feedback, name='feedback'),
    path('get-gewog-by-dzongkhag-id/<str:dzongkhag_id>', views.get_gewog_by_dzongkhag_id, name='get_gewog_by_dzongkhag_id')


]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
