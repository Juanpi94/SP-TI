# Generated by Django 4.2.7 on 2024-05-29 17:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='tramites',
            name='detalles',
            field=models.CharField(blank=True, max_length=200),
        ),
    ]
