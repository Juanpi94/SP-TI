# Generated by Django 4.0.4 on 2022-06-17 01:52

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0005_alter_activos_plaqueados_serie_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='tramites',
            name='urgencia',
        ),
    ]
