# Generated by Django 4.1.7 on 2024-04-15 15:01

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("WebApp", "0006_dzongkhag_gewog"),
    ]

    operations = [
        migrations.CreateModel(
            name="DataLayer",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("hasVisualization", models.BooleanField(default=True)),
                ("ui_id", models.CharField(max_length=100)),
                ("title", models.CharField(max_length=200)),
                ("url", models.URLField()),
                ("attribution", models.CharField(max_length=200)),
                ("layers", models.CharField(max_length=100)),
                ("default_style", models.CharField(max_length=100)),
                ("default_color_range", models.CharField(max_length=20)),
                ("overrange", models.CharField(max_length=20)),
                ("belowrange", models.CharField(max_length=20)),
                ("default_year", models.CharField(max_length=4)),
                (
                    "default_month",
                    models.CharField(blank=True, max_length=2, null=True),
                ),
                ("default_on", models.BooleanField(default=True)),
            ],
        ),
    ]