# Generated by Django 4.0.4 on 2023-01-16 00:28

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0019_alter_red_mac'),
    ]

    operations = [
        migrations.AlterField(
            model_name='activos_no_plaqueados',
            name='red',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.red'),
        ),
        migrations.AlterField(
            model_name='activos_plaqueados',
            name='red',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.red'),
        ),
    ]
