# Generated by Django 4.0.4 on 2023-01-16 00:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0018_red_ip_switch'),
    ]

    operations = [
        migrations.AlterField(
            model_name='red',
            name='MAC',
            field=models.CharField(max_length=45, unique=True),
        ),
    ]
