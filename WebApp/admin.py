from django.contrib import admin
from django.core.exceptions import ValidationError
from django import forms
from django.forms import HiddenInput
from import_export.admin import ImportExportModelAdmin

from WebApp.models import *

# Register the models to the admin site

admin.site.site_header = "Crop Monitoring Administration"


class BaseForm(forms.ModelForm):
    def clean(self):
        cleaned_data = super().clean()
        gewog = cleaned_data.get('gewog')
        dzongkhag = cleaned_data.get('dzongkhag')
        country = cleaned_data.get('country')

        # Check if more than one of gewog, dzongkhag, or country is set
        if sum(bool(field) for field in (gewog, dzongkhag, country)) > 1:
            raise ValidationError('Only one of gewog, dzongkhag, or country can be set.')

        # Check if none of gewog, dzongkhag, or country are set
        if not any((gewog, dzongkhag, country)):
            raise ValidationError('One of gewog, dzongkhag, or country must be set.')

        return cleaned_data


class SoilMoistureForm(BaseForm):
    class Meta:
        model = SoilMoisture
        fields = '__all__'


class SoilMoistureInline(admin.TabularInline):
    model = SoilMoisture
    form = SoilMoistureForm
    extra = 0

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)

        # Check if obj is provided and if it's a new instance
        if obj is not None and obj.pk is not None:
            if isinstance(obj, Country):
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['gewog'].widget = HiddenInput()
            # Check if the parent object is a Dzongkhag
            if isinstance(obj, Dzongkhag):
                # If editing a Dzongkhag instance and adding a new Soil Moisture instance, hide the gewog field
                formset.form.base_fields['gewog'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()
            elif isinstance(obj, Gewog):
                # If editing a Gewog instance and adding a new Soil Moisture instance, hide the dzongkhag field
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()

        return formset


class AverageRiceForm(BaseForm):
    class Meta:
        model = AverageRice
        fields = '__all__'


class AverageRiceInline(admin.TabularInline):
    model = AverageRice
    form = AverageRiceForm
    extra = 0

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)

        # Check if obj is provided and if it's a new instance
        if obj is not None and obj.pk is not None:
            if isinstance(obj, Country):
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['gewog'].widget = HiddenInput()
            # Check if the parent object is a Dzongkhag
            if isinstance(obj, Dzongkhag):
                # If editing a Dzongkhag instance and adding a new Soil Moisture instance, hide the gewog field
                formset.form.base_fields['gewog'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()
            elif isinstance(obj, Gewog):
                # If editing a Gewog instance and adding a new Soil Moisture instance, hide the dzongkhag field
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()


        return formset


class PaddyGainForm(BaseForm):
    class Meta:
        model = PaddyGain
        fields = '__all__'


class PaddyGainInline(admin.TabularInline):
    model = PaddyGain
    form = PaddyGainForm
    extra = 0

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)

        # Check if obj is provided and if it's a new instance
        if obj is not None and obj.pk is not None:
            if isinstance(obj, Country):
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['gewog'].widget = HiddenInput()
            # Check if the parent object is a Dzongkhag
            if isinstance(obj, Dzongkhag):
                # If editing a Dzongkhag instance and adding a new Soil Moisture instance, hide the gewog field
                formset.form.base_fields['gewog'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()
            elif isinstance(obj, Gewog):
                # If editing a Gewog instance and adding a new Soil Moisture instance, hide the dzongkhag field
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()

        return formset


class PaddyLossForm(BaseForm):
    class Meta:
        model = PaddyLoss
        fields = '__all__'


class PaddyLossInline(admin.TabularInline):
    model = PaddyLoss
    form = PaddyLossForm
    extra = 0

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)

        # Check if obj is provided and if it's a new instance
        if obj is not None and obj.pk is not None:
            if isinstance(obj, Country):
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['gewog'].widget = HiddenInput()
            # Check if the parent object is a Dzongkhag
            if isinstance(obj, Dzongkhag):
                # If editing a Dzongkhag instance and adding a new Soil Moisture instance, hide the gewog field
                formset.form.base_fields['gewog'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()
            elif isinstance(obj, Gewog):
                # If editing a Gewog instance and adding a new Soil Moisture instance, hide the dzongkhag field
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()

        return formset


class NDVIForm(BaseForm):
    class Meta:
        model = NDVI
        fields = '__all__'


class NDVIInline(admin.TabularInline):
    model = NDVI
    form = NDVIForm
    extra = 0

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)

        # Check if obj is provided and if it's a new instance
        if obj is not None and obj.pk is not None:
            if isinstance(obj, Country):
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['gewog'].widget = HiddenInput()
            # Check if the parent object is a Dzongkhag
            if isinstance(obj, Dzongkhag):
                # If editing a Dzongkhag instance and adding a new Soil Moisture instance, hide the gewog field
                formset.form.base_fields['gewog'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()
            elif isinstance(obj, Gewog):
                # If editing a Gewog instance and adding a new Soil Moisture instance, hide the dzongkhag field
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()

        return formset


class PrecipitationForm(BaseForm):
    class Meta:
        model = NDVI
        fields = '__all__'


class PrecipitationInline(admin.TabularInline):
    model = Precipitation
    form = PrecipitationForm
    extra = 0

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)

        # Check if obj is provided and if it's a new instance
        if obj is not None and obj.pk is not None:
            if isinstance(obj, Country):
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['gewog'].widget = HiddenInput()
            # Check if the parent object is a Dzongkhag
            if isinstance(obj, Dzongkhag):
                # If editing a Dzongkhag instance and adding a new Soil Moisture instance, hide the gewog field
                formset.form.base_fields['gewog'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()
            elif isinstance(obj, Gewog):
                # If editing a Gewog instance and adding a new Soil Moisture instance, hide the dzongkhag field
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()

        return formset


class TemperatureForm(BaseForm):
    class Meta:
        model = Temperature
        fields = '__all__'


class TemperatureInline(admin.TabularInline):
    model = Temperature
    form = TemperatureForm
    extra = 0

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)

        # Check if obj is provided and if it's a new instance
        if obj is not None and obj.pk is not None:
            if isinstance(obj, Country):
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['gewog'].widget = HiddenInput()
            # Check if the parent object is a Dzongkhag
            if isinstance(obj, Dzongkhag):
                # If editing a Dzongkhag instance and adding a new Soil Moisture instance, hide the gewog field
                formset.form.base_fields['gewog'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()
            elif isinstance(obj, Gewog):
                # If editing a Gewog instance and adding a new Soil Moisture instance, hide the dzongkhag field
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()

        return formset


class RiceDistributionForm(BaseForm):
    class Meta:
        model = RiceDistribution
        fields = '__all__'


class RiceDistributionInline(admin.TabularInline):
    model = RiceDistribution
    form = RiceDistributionForm
    extra = 0

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)

        # Check if obj is provided and if it's a new instance
        if obj is not None and obj.pk is not None:
            if isinstance(obj, Country):
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['gewog'].widget = HiddenInput()
            # Check if the parent object is a Dzongkhag
            if isinstance(obj, Dzongkhag):
                # If editing a Dzongkhag instance and adding a new Soil Moisture instance, hide the gewog field
                formset.form.base_fields['gewog'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()
            elif isinstance(obj, Gewog):
                # If editing a Gewog instance and adding a new Soil Moisture instance, hide the dzongkhag field
                formset.form.base_fields['dzongkhag'].widget = HiddenInput()
                formset.form.base_fields['country'].widget = forms.HiddenInput()

        return formset


@admin.register(Country)
class CountryAdmin(ImportExportModelAdmin, admin.ModelAdmin):
    list_display = ('country_id', 'country_name')  # list of fields to display
    inlines = [AverageRiceInline, PaddyGainInline, PaddyLossInline, NDVIInline, PrecipitationInline, SoilMoistureInline,
               TemperatureInline, RiceDistributionInline, ]
    search_fields = ('country_name',)  # search by station name


@admin.register(Dzongkhag)
class DzongkhagAdmin(admin.ModelAdmin):
    list_display = ('dzongkhag_id', 'dzongkhag_name', 'country')
    inlines = [AverageRiceInline, PaddyGainInline, PaddyLossInline, NDVIInline, PrecipitationInline, SoilMoistureInline,
        TemperatureInline, RiceDistributionInline, ]
    list_filter = ('country',)  # Filter by Country
    search_fields = ('dzongkhag_name', 'country__country_name')  # Search by dzongkhag_name or Country


@admin.register(Gewog)
class GewogAdmin(admin.ModelAdmin):
    list_display = ('gewog_id', 'gewog_name', 'get_dzongkhag_country', 'get_dzongkhag_name')
    list_filter = ('dzongkhag__country', 'dzongkhag')  # Filter by country or Dzongkhag
    inlines = [AverageRiceInline, PaddyGainInline, PaddyLossInline, NDVIInline, PrecipitationInline, SoilMoistureInline,
        TemperatureInline, RiceDistributionInline, ]
    search_fields = ('gewog_name', 'dzongkhag__dzongkhag_name',
                     'dzongkhag__country__country_name')  # Search by gewog_name, Dzongkhag, or Country

    def get_dzongkhag_country(self, obj):
        return obj.dzongkhag.country.country_name

    get_dzongkhag_country.short_description = 'Country'  # Display name in admin

    def get_dzongkhag_name(self, obj):
        return obj.dzongkhag.dzongkhag_name

    get_dzongkhag_name.short_description = 'Dzongkhag'  # Display name in admin


class DataLayerAdmin(admin.ModelAdmin):
    list_display = ('title', 'ui_id', 'hasVisualization', 'default_on')
    list_filter = ('hasVisualization', 'default_on')
    search_fields = ('title', 'ui_id', 'attribution')


admin.site.register(DataLayer, DataLayerAdmin)
