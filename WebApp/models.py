from django.db import models


class AverageRice(models.Model):
    value = models.FloatField()
    year = models.PositiveSmallIntegerField()
    gewog = models.ForeignKey('Gewog', on_delete=models.CASCADE, null=True, blank=True)
    dzongkhag = models.ForeignKey('Dzongkhag', on_delete=models.CASCADE, null=True, blank=True)
    country = models.ForeignKey('Country', on_delete=models.CASCADE, null=True, blank=True)


class PaddyChangeFrom2008(models.Model):
    value = models.FloatField()
    year = models.PositiveSmallIntegerField()
    gewog = models.ForeignKey('Gewog', on_delete=models.CASCADE, null=True, blank=True)
    dzongkhag = models.ForeignKey('Dzongkhag', on_delete=models.CASCADE, null=True, blank=True)
    country = models.ForeignKey('Country', on_delete=models.CASCADE, null=True, blank=True)


class PaddyChangeFrom2020(models.Model):
    value = models.FloatField()
    year = models.PositiveSmallIntegerField()
    gewog = models.ForeignKey('Gewog', on_delete=models.CASCADE, null=True, blank=True)
    dzongkhag = models.ForeignKey('Dzongkhag', on_delete=models.CASCADE, null=True, blank=True)
    country = models.ForeignKey('Country', on_delete=models.CASCADE, null=True, blank=True)


class NDVI(models.Model):
    value = models.FloatField()
    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField(default=1, null=True, blank=True)
    gewog = models.ForeignKey('Gewog', on_delete=models.CASCADE, null=True, blank=True)
    dzongkhag = models.ForeignKey('Dzongkhag', on_delete=models.CASCADE, null=True, blank=True)
    country = models.ForeignKey('Country', on_delete=models.CASCADE, null=True, blank=True)


class Precipitation(models.Model):
    value = models.FloatField()
    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField(default=1, null=True, blank=True)
    gewog = models.ForeignKey('Gewog', on_delete=models.CASCADE, null=True, blank=True)
    dzongkhag = models.ForeignKey('Dzongkhag', on_delete=models.CASCADE, null=True, blank=True)
    country = models.ForeignKey('Country', on_delete=models.CASCADE, null=True, blank=True)


class SoilMoisture(models.Model):
    value = models.FloatField()
    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField(default=1, null=True, blank=True)
    gewog = models.ForeignKey('Gewog', on_delete=models.CASCADE, null=True, blank=True)
    dzongkhag = models.ForeignKey('Dzongkhag', on_delete=models.CASCADE, null=True, blank=True)
    country = models.ForeignKey('Country', on_delete=models.CASCADE, null=True, blank=True)


class Temperature(models.Model):
    value = models.FloatField(default=0, null=True, blank=True)
    min = models.FloatField(default=0, null=True, blank=True)
    max = models.FloatField(default=0, null=True, blank=True)
    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField(default=1, null=True, blank=True)
    gewog = models.ForeignKey('Gewog', on_delete=models.CASCADE, null=True, blank=True)
    dzongkhag = models.ForeignKey('Dzongkhag', on_delete=models.CASCADE, null=True, blank=True)
    country = models.ForeignKey('Country', on_delete=models.CASCADE, null=True, blank=True)


class RiceDistribution(models.Model):
    value = models.FloatField()
    year = models.PositiveSmallIntegerField()
    gewog = models.ForeignKey('Gewog', on_delete=models.CASCADE, null=True, blank=True)
    dzongkhag = models.ForeignKey('Dzongkhag', on_delete=models.CASCADE, null=True, blank=True)
    country = models.ForeignKey('Country', on_delete=models.CASCADE, null=True, blank=True)


class Country(models.Model):
    country_id = models.CharField(max_length=10, primary_key=True,
                                  help_text="Country ID")
    country_name = models.CharField(max_length=100, help_text="Country Name")
    country_geometry = models.JSONField(help_text="JSON representation of the country geometry")

    def __str__(self):
        return self.country_name


class Dzongkhag(models.Model):
    dzongkhag_id = models.CharField(max_length=10, primary_key=True, help_text="Dzongkhag ID")
    dzongkhag_name = models.CharField(max_length=100, help_text="Dzongkhag Name")
    dzongkhag_geometry = models.JSONField(help_text="JSON representation of the dzongkhag")
    country = models.ForeignKey(Country, on_delete=models.CASCADE)

    def __str__(self):
        return self.dzongkhag_name


class Gewog(models.Model):
    gewog_id = models.CharField(max_length=10, primary_key=True, help_text="Gewog ID")
    gewog_name = models.CharField(max_length=100, help_text="Gewog Name")
    gewog_geometry = models.JSONField(help_text="JSON representation of the gewog")
    dzongkhag = models.ForeignKey(Dzongkhag, on_delete=models.CASCADE)  # ForeignKey to Dzongkhag

    def __str__(self):
        return self.gewog_name


class DataLayer(models.Model):
    hasVisualization = models.BooleanField(default=True)
    ui_id = models.CharField(max_length=100)
    title = models.CharField(max_length=200)
    url = models.URLField()
    attribution = models.CharField(max_length=200)
    layers = models.CharField(max_length=100)
    default_style = models.CharField(max_length=100)
    default_color_range = models.CharField(max_length=20)
    overrange = models.CharField(max_length=20)
    belowrange = models.CharField(max_length=20)
    default_year = models.CharField(max_length=4)
    default_month = models.CharField(max_length=2, null=True, blank=True)
    default_on = models.BooleanField(default=True)

    def __str__(self):
        return self.title
