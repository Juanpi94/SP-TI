# Generated by Django 4.2.7 on 2024-05-16 03:00

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Estados',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('descripcion', models.CharField(max_length=40, verbose_name='Descripción')),
            ],
            options={
                'verbose_name_plural': 'Estados',
            },
        ),
        migrations.CreateModel(
            name='Funcionarios',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cedula', models.CharField(max_length=120)),
                ('nombre_completo', models.CharField(max_length=120, unique=True)),
                ('correo_institucional', models.CharField(blank=True, max_length=120, null=True)),
                ('correo_personal', models.CharField(blank=True, max_length=120, null=True)),
                ('telefono_oficina', models.CharField(blank=True, max_length=120, null=True)),
                ('telefono_personal', models.CharField(blank=True, max_length=120, null=True)),
            ],
            options={
                'verbose_name_plural': 'Funcionarios',
            },
        ),
        migrations.CreateModel(
            name='Instalaciones',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ubicacion', models.CharField(max_length=120, unique=True)),
            ],
            options={
                'verbose_name_plural': 'Instalaciones',
            },
        ),
        migrations.CreateModel(
            name='Permissions',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ],
            options={
                'verbose_name_plural': 'Permissions',
            },
        ),
        migrations.CreateModel(
            name='Proveedor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=230, unique=True)),
                ('telefono', models.CharField(max_length=16)),
                ('correo', models.EmailField(max_length=254)),
            ],
            options={
                'verbose_name_plural': 'Proveedores',
            },
        ),
        migrations.CreateModel(
            name='PruebasAPI',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dato1', models.CharField(max_length=120)),
                ('dato2', models.CharField(max_length=120)),
                ('dato3', models.CharField(blank=True, max_length=120, null=True)),
            ],
            options={
                'verbose_name_plural': 'PruebasAPIs',
            },
        ),
        migrations.CreateModel(
            name='Red',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('MAC', models.CharField(max_length=45, unique=True)),
                ('IP', models.CharField(blank=True, default='', max_length=20)),
                ('IP6', models.CharField(blank=True, default='', max_length=40)),
                ('IP_switch', models.CharField(blank=True, default='', max_length=80)),
            ],
            options={
                'verbose_name_plural': 'Red',
            },
        ),
        migrations.CreateModel(
            name='Subtipo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=120)),
                ('detalle', models.CharField(blank=True, max_length=200)),
            ],
            options={
                'verbose_name_plural': 'Subtipos',
            },
        ),
        migrations.CreateModel(
            name='Tipo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=120)),
                ('detalle', models.CharField(blank=True, max_length=200)),
            ],
            options={
                'verbose_name_plural': 'Tipos',
            },
        ),
        migrations.CreateModel(
            name='TiposEstados',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=20, unique=True)),
            ],
            options={
                'verbose_name_plural': 'TiposEstados',
            },
        ),
        migrations.CreateModel(
            name='TiposTramites',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=20, unique=True)),
            ],
            options={
                'verbose_name_plural': 'TiposTramites',
            },
        ),
        migrations.CreateModel(
            name='Tramites',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('referencia', models.CharField(max_length=120, unique=True)),
                ('detalles', models.CharField(max_length=900)),
                ('fecha', models.DateField(default=django.utils.timezone.now)),
                ('estado', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='backend.tiposestados')),
                ('recipiente', models.ForeignKey(null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='backend.funcionarios')),
                ('remitente', models.ForeignKey(null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='backend.funcionarios')),
                ('solicitante', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to=settings.AUTH_USER_MODEL)),
                ('tipo', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='backend.tipostramites')),
            ],
            options={
                'verbose_name_plural': 'Tramites',
            },
        ),
        migrations.CreateModel(
            name='Unidad',
            fields=[
                ('codigo', models.CharField(max_length=5, primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=120, null=True)),
                ('coordinador', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.funcionarios')),
            ],
            options={
                'verbose_name_plural': 'Unidades',
            },
        ),
        migrations.CreateModel(
            name='Ubicaciones',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ubicacion', models.CharField(max_length=120, unique=True)),
                ('custodio', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='backend.funcionarios')),
                ('instalacion', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='backend.instalaciones')),
                ('unidad', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.unidad')),
            ],
            options={
                'verbose_name_plural': 'Ubicaciones',
            },
        ),
        migrations.CreateModel(
            name='Traslados',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('detalle', models.CharField(default='', max_length=120)),
                ('destino', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='backend.ubicaciones')),
                ('tramite', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='traslados', to='backend.tramites')),
            ],
            options={
                'verbose_name_plural': 'Traslados',
            },
        ),
        migrations.CreateModel(
            name='Taller',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('destinatario', models.CharField(max_length=200)),
                ('beneficiario', models.CharField(max_length=200)),
                ('autor', models.CharField(max_length=200)),
                ('tramite', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='taller', to='backend.tramites')),
            ],
            options={
                'verbose_name_plural': 'Talleres',
            },
        ),
        migrations.CreateModel(
            name='RelPruebasAPI',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dato1', models.CharField(max_length=120)),
                ('dato2', models.CharField(max_length=120)),
                ('dato3', models.CharField(blank=True, max_length=120, null=True)),
                ('dato4', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.pruebasapi')),
            ],
            options={
                'verbose_name_plural': 'RelPruebasAPI',
            },
        ),
        migrations.CreateModel(
            name='Deshecho',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tramite', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='backend.tramites')),
            ],
            options={
                'verbose_name_plural': 'Deshechos',
            },
        ),
        migrations.CreateModel(
            name='Compra',
            fields=[
                ('numero_orden_compra', models.CharField(max_length=40, primary_key=True, serialize=False)),
                ('numero_solicitud', models.CharField(blank=True, max_length=150)),
                ('origen_presupuesto', models.CharField(blank=True, max_length=200)),
                ('decision_inicial', models.CharField(blank=True, max_length=100)),
                ('numero_procedimiento', models.CharField(blank=True, max_length=120)),
                ('numero_factura', models.CharField(blank=True, max_length=120)),
                ('detalle', models.CharField(blank=True, max_length=300)),
                ('informe_tecnico', models.CharField(blank=True, max_length=120)),
                ('proveedor', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.proveedor')),
            ],
            options={
                'verbose_name_plural': 'Compras',
            },
        ),
        migrations.CreateModel(
            name='Activos_Plaqueados',
            fields=[
                ('observacion', models.CharField(blank=True, max_length=500, null=True, verbose_name='Observación')),
                ('nombre', models.CharField(max_length=120, verbose_name='Nombre')),
                ('marca', models.CharField(blank=True, max_length=200, verbose_name='Marca')),
                ('valor_colones', models.DecimalField(decimal_places=2, max_digits=12)),
                ('valor_dolares', models.DecimalField(decimal_places=2, max_digits=12)),
                ('modelo', models.CharField(blank=True, max_length=200, verbose_name='Modelo')),
                ('garantia', models.DateField(null=True, verbose_name='Garantia')),
                ('fecha_ingreso', models.DateField(null=True, verbose_name='Fecha de Ingreso')),
                ('fecha_registro', models.DateField(auto_now_add=True, verbose_name='Fecha de Registro')),
                ('placa', models.CharField(max_length=20, primary_key=True, serialize=False)),
                ('serie', models.CharField(max_length=200, null=True, unique=True, verbose_name='Serie')),
                ('compra', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.compra', verbose_name='Compra')),
                ('estado', models.ForeignKey(default='1', on_delete=django.db.models.deletion.DO_NOTHING, to='backend.estados', verbose_name='Estados')),
                ('red', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.red', verbose_name='Red')),
                ('subtipo', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.subtipo', verbose_name='Subtipo')),
                ('tipo', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.tipo', verbose_name='Tipo')),
                ('tramites', models.ManyToManyField(blank=True, to='backend.tramites', verbose_name='Tramites')),
                ('ubicacion', models.ForeignKey(null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='backend.ubicaciones', verbose_name='Ubicación')),
                ('ubicacion_anterior', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='plaqueados', to='backend.ubicaciones')),
            ],
            options={
                'verbose_name_plural': 'Activos Plaqueados',
            },
        ),
        migrations.CreateModel(
            name='Activos_No_Plaqueados',
            fields=[
                ('observacion', models.CharField(blank=True, max_length=500, null=True, verbose_name='Observación')),
                ('nombre', models.CharField(max_length=120, verbose_name='Nombre')),
                ('marca', models.CharField(blank=True, max_length=200, verbose_name='Marca')),
                ('valor_colones', models.DecimalField(decimal_places=2, max_digits=12)),
                ('valor_dolares', models.DecimalField(decimal_places=2, max_digits=12)),
                ('modelo', models.CharField(blank=True, max_length=200, verbose_name='Modelo')),
                ('garantia', models.DateField(null=True, verbose_name='Garantia')),
                ('fecha_ingreso', models.DateField(null=True, verbose_name='Fecha de Ingreso')),
                ('fecha_registro', models.DateField(auto_now_add=True, verbose_name='Fecha de Registro')),
                ('serie', models.CharField(max_length=200, primary_key=True, serialize=False)),
                ('compra', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.compra', verbose_name='Compra')),
                ('estado', models.ForeignKey(default='1', on_delete=django.db.models.deletion.DO_NOTHING, to='backend.estados', verbose_name='Estados')),
                ('red', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.red', verbose_name='Red')),
                ('subtipo', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.subtipo', verbose_name='Subtipo')),
                ('tipo', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='backend.tipo', verbose_name='Tipo')),
                ('tramites', models.ManyToManyField(blank=True, to='backend.tramites', verbose_name='Tramites')),
                ('ubicacion', models.ForeignKey(null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='backend.ubicaciones', verbose_name='Ubicación')),
                ('ubicacion_anterior', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='no_anterior', to='backend.ubicaciones')),
            ],
            options={
                'verbose_name_plural': 'Activos No Plaqueados',
            },
        ),
    ]
