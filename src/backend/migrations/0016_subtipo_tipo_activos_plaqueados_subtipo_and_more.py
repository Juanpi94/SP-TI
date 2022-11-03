# Generated by Django 4.0.4 on 2022-09-30 01:47

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0015_rename_lugar_ubicaciones_nombre_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Subtipo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=120)),
            ],
        ),
        migrations.CreateModel(
            name='Tipo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=120)),
            ],
        ),
        migrations.AddField(
            model_name='activos_plaqueados',
            name='subtipo',
            field=models.OneToOneField(null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.subtipo'),
        ),
        migrations.AddField(
            model_name='activos_plaqueados',
            name='tipo',
            field=models.OneToOneField(null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.tipo'),
        ),
    ]
