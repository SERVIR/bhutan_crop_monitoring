from django.contrib import admin
from import_export.admin import ImportExportModelAdmin

from WebApp.models import Country, Dzongkhag, Gewog

# Register the models to the admin site

admin.site.site_header = "Crop Monitoring Administration"



@admin.register(Country)
class CountryAdmin(ImportExportModelAdmin, admin.ModelAdmin):
    list_display = (
        'country_id', 'country_name')  # list of fields to display
    search_fields = ('country_name', )  # search by station name



@admin.register(Dzongkhag)
class DzongkhagAdmin(admin.ModelAdmin):
    list_display = ('dzongkhag_id', 'dzongkhag_name', 'country')
    list_filter = ('country',)  # Filter by Country
    search_fields = ('dzongkhag_name', 'country__country_name')  # Search by dzongkhag_name or Country


@admin.register(Gewog)
class GewogAdmin(admin.ModelAdmin):
    list_display = ('gewog_id', 'gewog_name', 'get_dzongkhag_country', 'get_dzongkhag_name')
    list_filter = ('dzongkhag__country', 'dzongkhag')  # Filter by country or Dzongkhag
    search_fields = ('gewog_name', 'dzongkhag__dzongkhag_name', 'dzongkhag__country__country_name')  # Search by gewog_name, Dzongkhag, or Country

    def get_dzongkhag_country(self, obj):
        return obj.dzongkhag.country.country_name
    get_dzongkhag_country.short_description = 'Country'  # Display name in admin

    def get_dzongkhag_name(self, obj):
        return obj.dzongkhag.dzongkhag_name
    get_dzongkhag_name.short_description = 'Dzongkhag'  # Display name in admin