# Generated by Django 4.1.7 on 2024-05-13 15:47

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("WebApp", "0016_rename_ricedistribution_riceyield"),
    ]

    operations = [
        migrations.AddField(
            model_name="riceyield",
            name="predicted",
            field=models.FloatField(blank=True, default=0, null=True),
        ),
    ]
