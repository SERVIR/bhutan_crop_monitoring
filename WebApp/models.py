from django.db import models

# Organization model: This data model describes an organization that operates a monitoring station network
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
