# Generated by Django 4.0.4 on 2022-05-04 02:12

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0003_alter_activos_plaqueados_tramite_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='tramites',
            name='recipiente',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='backend.funcionarios'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='tramites',
            name='remitente',
            field=models.ForeignKey(default=2, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='backend.funcionarios'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='tramites',
            name='urgencia',
            field=models.CharField(choices=[('H', 'Urgente'), ('N', 'Normal'), ('L', 'Baja')], default='N', max_length=1),
        ),
    ]
