# Generated by Django 4.0.4 on 2023-01-10 03:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0007_alter_activos_no_plaqueados_subtipo_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='activos_no_plaqueados',
            name='observacion',
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.AlterField(
            model_name='activos_plaqueados',
            name='observacion',
            field=models.CharField(blank=True, max_length=300),
        ),
    ]
