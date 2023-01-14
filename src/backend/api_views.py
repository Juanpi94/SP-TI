from datetime import datetime
from http.client import HTTPResponse
from io import BytesIO
import json
from math import isnan
from urllib import request
from django.shortcuts import redirect
from django.urls import reverse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework import status
from rest_framework.response import Response
from backend import models
from backend.serializers import CompraSerializer, DeshechoSerializer, FuncionariosSerializer, NoPlaqueadosSerializer, PlaqueadosSerializer, SubtipoSerializer, TallerSerializer, TipoSerializer, TramitesCreateSerializer, TramitesSerializer, TrasladosSerializer, UbicacionesSerializer, UserSerializer
from rest_framework.decorators import action
import pandas as pd
from django.core.exceptions import ObjectDoesNotExist
import pandas.io.formats.excel
# ModelViewset con la capacidad de especificar más de un serializador, dependiendo de la acción


class CustomModelViewset(ModelViewSet):
    retrieve_serializer = None

    def get_serializer_class(self):
        if(self.action == "retrieve"):
            return self.retrieve_serializer
        else:
            return self.serializer_class


class PlaqueadosApiViewset(ModelViewSet):
    queryset = models.Activos_Plaqueados.objects.all()
    serializer_class = PlaqueadosSerializer

    permission_classes = [AllowAny]
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ('serie', "placa")


class NoPlaqueadosApiViewSet(ModelViewSet):
    queryset = models.Activos_No_Plaqueados.objects.all()
    serializer_class = NoPlaqueadosSerializer

    permission_classes = [AllowAny]
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ('serie',)


class TramitesApiViewset(ModelViewSet):
    queryset = models.Tramites.objects.all()
    serializer_class = TramitesSerializer
    permission_classes = [AllowAny]

    def perform_update(self, serializer):

        estado_anterior = models.Tramites.objects.filter(
            referencia=serializer.validated_data["referencia"]).first().estado
        tramite = serializer.save()

        if tramite.estado == models.Tramites.TiposEstado.FINALIZADO and estado_anterior == models.Tramites.TiposEstado.PENDIENTE:

            if tramite.tipo == models.Tramites.TiposTramites.TRASLADO:
                for activo_plaqueado in tramite.activos_plaqueados_set.all():
                    activo_plaqueado.ubicacion_anterior = activo_plaqueado.ubicacion
                    activo_plaqueado.ubicacion = models.Traslados.objects.filter(
                        detalle__contains=activo_plaqueado.placa).first().destino

                    activo_plaqueado.save()
                for activo_no_plaqueado in tramite.activos_no_plaqueados_set.all():
                    activo_no_plaqueado.ubicacion_anterior = activo_no_plaqueado.ubicacion
                    activo_no_plaqueado.ubicacion = models.Traslados.objects.filter(
                        detalle__contains=activo_no_plaqueado.serie).first().destino
                    activo_no_plaqueado.save()

            elif tramite.tipo == models.Tramites.TiposTramites.DESHECHO:
                for activo_plaqueado in tramite.activos_plaqueados_set.all():
                    activo_plaqueado.estado = models.Activo.Estados.DESHECHO
                    activo_plaqueado.save()
                for activo_no_plaqueado in tramite.activos_no_plaqueados_set.all():
                    activo_no_plaqueado.estado = models.Activo.Estados.DESHECHO
                    activo_no_plaqueado.save()

        return tramite

    def create(self, request):

        data = request.data
        activos_plaqueados = data.pop("activosPlaqueados")
        activos_no_plaqueados = data.pop("activosNoPlaqueados")
        taller = None
        if data.get("taller"):
            taller = data.pop("taller")
        serializer = TramitesCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        tramite = self.perform_create(serializer)

        if tramite.tipo == models.Tramites.TiposTramites.TALLER and taller:
            taller_db = models.Taller()
            taller_db.beneficiario = taller.get("beneficiario")
            taller_db.destinatario = taller.get("destinatario")
            taller_db.tramite = tramite
            taller_db.save()

        if tramite.tipo == models.Tramites.TiposTramites.DESHECHO:
            deshecho_db = models.Deshecho()
            deshecho_db.tramite = tramite
            deshecho_db.save()

        for activo in activos_plaqueados:
            activo_db = models.Activos_Plaqueados.objects.get(id=activo)
            activo_db.tramites.add(tramite)
            if(tramite.tipo == models.Tramites.TiposTramites.DESHECHO):
                activo_db.estado = models.Activo.Estados.PROCESO_DESHECHO
            activo_db.save()

            if(tramite.tipo == models.Tramites.TiposTramites.TRASLADO):
                traslados = data['traslados']
                plaqueados = list(filter(lambda traslado: traslado["tipo"] ==
                                         "PLAQUEADO" and traslado["activo"] == activo_db.id, traslados))

                if(len(plaqueados) == 0):
                    continue
                traslado = plaqueados[0]
                traslado_db = models.Traslados()
                traslado_db.destino = models.Ubicaciones.objects.get(
                    id=traslado["destino"])
                traslado_db.tramite = tramite
                traslado_db.detalle = "Plaqueado: " + activo_db.placa
                traslado_db.save()

        for activo in activos_no_plaqueados:
            activo_db = models.Activos_No_Plaqueados.objects.get(id=activo)
            activo_db.tramites.add(tramite)
            if(tramite.tipo == models.Tramites.TiposTramites.DESHECHO):
                activo_db.estado = models.Activo.Estados.PROCESO_DESHECHO
            activo_db.save()

            if(tramite.tipo == models.Tramites.TiposTramites.TRASLADO):
                traslados = data['traslados']
                no_plaqueados = list(filter(lambda traslado: traslado["tipo"] ==
                                            "NO_PLAQUEADO" and traslado["activo"] == activo_db.id, traslados))
                if(len(no_plaqueados) == 0):
                    continue
                traslado = no_plaqueados[0]
                traslado_db = models.Traslados()
                traslado_db.destino = models.Ubicaciones.objects.get(
                    id=traslado["destino"])
                traslado_db.tramite = tramite
                traslado_db.detalle = "No Plaqueado: " + activo_db.serie
                traslado_db.save()

        headers = self.get_success_headers(serializer.data)

        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        return serializer.save()


class DeshechoApiViewset(ModelViewSet):
    queryset = models.Deshecho.objects.all()
    serializer_class = DeshechoSerializer
    permission_classes = [AllowAny]


class TrasladosApiViewset(ModelViewSet):
    queryset = models.Traslados.objects.all()
    serializer_class = TrasladosSerializer
    permission_classes = [AllowAny]
    filter_backends = (DjangoFilterBackend,)


class TallerApiViewset(ModelViewSet):
    queryset = models.Taller.objects.all()
    serializer_class = TallerSerializer
    permission_classes = [AllowAny]
    filter_backends = (DjangoFilterBackend)


class FuncionariosApiViewset(ModelViewSet):
    queryset = models.Funcionarios.objects.all()
    serializer_class = FuncionariosSerializer


class TipoApiViewset(ModelViewSet):
    queryset = models.Tipo.objects.all()
    serializer_class = TipoSerializer


class SubtipoApiViewSet(ModelViewSet):
    queryset = models.Subtipo.objects.all()
    serializer_class = SubtipoSerializer


class UbicacionesApiViewset(ModelViewSet):
    queryset = models.Ubicaciones.objects.all()
    serializer_class = UbicacionesSerializer


class CompraApiViewset(ModelViewSet):
    queryset = models.Compra.objects.all()
    serializer_class = CompraSerializer


class UserApiViewset(ModelViewSet):
    queryset = models.User.objects.all()
    serializer_class = UserSerializer


class ImportarActivosApiView(APIView):
    permission_classes = [AllowAny]
    columns = ["nombre", "placa", "detalle", "marca",
               "serie",	"valor", "modelo", "garantia", "ubicacion"]

    optional_columns = ['ubicacion', 'garantia']
    model = models.Activos_Plaqueados

    def post(self, request, format=None):
        file = request.FILES['file']
        excel_file = pd.read_excel(file, usecols=self.columns)
        activos_erroneos = []
        redirect_url = reverse("importar-activos")
        success_number = 0
        skip_current = False
        for row in excel_file.itertuples(index=False):
            row_dict = row._asdict()
            for item in row_dict:
                value = row_dict[item]
                if(type(value) == float and isnan(value) and item not in self.optional_columns):
                    message = f'Error al importar activos, asegurese que el campo {item} tenga valores'
                    error = True
                    return redirect(f"{redirect_url}?message={message}&error={error}")

            if(row_dict['ubicacion']):
                try:
                    row_dict['ubicacion'] = models.Ubicaciones.objects.get(
                        nombre__icontains=row_dict['ubicacion'])
                except ObjectDoesNotExist:
                    activos_erroneos.append(
                        f"{row_dict['nombre']} : {row_dict['placa']}")
                    print("printed")
                    skip_current = True
            for optional_column in self.optional_columns:
                if(type(row_dict[optional_column]) == float and isnan(row_dict[optional_column])):
                    row_dict.pop(optional_column)

            if (not skip_current):
                self.model.objects.create(**row_dict)
                success_number += 1
            skip_current = False
        error = False
        message = f"{success_number} activos importados con éxito, {activos_erroneos.__len__()} activos érroneos: {', '.join(activos_erroneos) if activos_erroneos.__len__() else 'No hubieron errores'}"
        return redirect(f"{redirect_url}?message={message}&error={error}")


class ImportarActivosNoPlaqueadosApiView(APIView):
    permission_classes = [AllowAny]
    columns = ["nombre", "detalle", "marca",
               "serie",	"valor", "modelo", "garantia", "ubicacion"]

    optional_columns = ['ubicacion', 'garantia']
    model = models.Activos_No_Plaqueados

    def post(self, request, format=None):
        file = request.FILES['file']
        excel_file = pd.read_excel(file, usecols=self.columns)
        activos_erroneos = []
        redirect_url = reverse("importar-activos")
        success_number = 0
        skip_current = False
        for row in excel_file.itertuples(index=False):
            row_dict = row._asdict()
            for item in row_dict:
                value = row_dict[item]
                if(type(value) == float and isnan(value) and item not in self.optional_columns):
                    message = f'Error al importar activos, asegurese que el campo {item} tenga valores'
                    error = True
                    return redirect(f"{redirect_url}?message={message}&error={error}")

            if(row_dict['ubicacion']):
                try:
                    row_dict['ubicacion'] = models.Ubicaciones.objects.get(
                        nombre__icontains=row_dict['ubicacion'])
                except ObjectDoesNotExist:
                    activos_erroneos.append(
                        f"{row_dict['nombre']} : {row_dict['placa']}")
                    print("printed")
                    skip_current = True
            for optional_column in self.optional_columns:
                if(type(row_dict[optional_column]) == float and isnan(row_dict[optional_column])):
                    row_dict.pop(optional_column)

            if (not skip_current):
                self.model.objects.create(**row_dict)
                success_number += 1
            skip_current = False
        error = False
        message = f"{success_number} activos importados con éxito, {activos_erroneos.__len__()} activos érroneos: {', '.join(activos_erroneos) if activos_erroneos.__len__() else 'No hubieron errores'}"
        return redirect(f"{redirect_url}?message={message}&error={error}")


class ExportarHojaDeCalculo(APIView):
    permission_classes = [AllowAny]

    def post(self, request, format=None):

        json_data = request.data

        parsed_json = pd.DataFrame(json.loads(json_data['data']))
        with BytesIO() as b:
            writer = pd.ExcelWriter(b, engine="xlsxwriter", mode="xlswriter")
            pandas.io.formats.excel.header_style = None
            parsed_json.to_excel(writer, sheet_name="Reporte")
            worksheet = writer.sheets["Reporte"]
            workbook = writer.book
            worksheet.autofit()
            header_fmt = workbook.add_format(
                {"bold": True, "fg_color": "#FCD5B4"})

            for col_num, value in enumerate(parsed_json.columns.values):
                worksheet.write(0, col_num + 1, value, header_fmt)
            writer.save()
            return Response({"data": b.getbuffer().hex()})


class ChangePasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, format=None):
        json_data = request.data
        print(request.user)
        password = json_data['password']
        request.user.set_password(password)
        request.user.save()
        return Response(None, status.HTTP_202_ACCEPTED)


"""
{'_0': 2019.0, 'placa': 400882, 'zona': 'Instalaciones Cocal', 'nombre': 'Proyector', 'tipo': 'Proyector', 'subtipo': 'Rendimiento Intermedio', 'marca': 'EPSON', 'modelo': 'PowerLite W42+', 'serie': 'X4JA8300237', 'valor': 389700, 'garantia__': '25-08-2020', 'detalle': 'Referencia Garantía fecha acta de asignación de activos', 'custodio': 'Oriester Abarca Hernández', 'unidad': 'Coord de Docencia', 'coordinador_unidad': 'Oriester Abarca Hernández', 'ubicacion': 'Coord de Docencia', 'estado': 'Óptimo', 'descripcion_estado': 'Equipo dentro del período de garantía', 'codigo_partida': '5-01-07-01', 'descripcion_partida': 'Equipo educacional y cultural', 'fecha_ingreso': '11-01-2019', 'numero_orden_de_compra_o_referencia': 205018, 'origen_presupuesto': '190-000-1050', 'decision_inicial': 'Pendiente', 'numero_solicitud': '2018-1634', 'numero_procedimiento': '2014LN-000005-0000900001', 'numero_factura': '00100001010000007898', 'nombre__proveedor': 'Epson Costa Rica S.A', 'telefono_proveedor': 25887855, 'correo_empresa': 'facturaelectronica@epson.co.cr', 'detalles_de_presupuesto': 'Docencia-Demanda-SP-TI-Traslado-040-2019', 'informe_tecnico': nan, 'fecha_registro': '15-01-2019', 'observacion_de_ingreso': 'pendiente', 'traslado': 'SP-TI-Traslado-040-2019', 'filtros_presu': 'Docencia-Demanda-SP-TI-Traslado-040-2019', 'tipo_presupuesto': 'Ordinario', 'tipo_de_compra': 'Demanda', 'mac': nan, 'ip': nan, 'ip_switch': nan, '_41': nan, '_42': nan}
"""


class ImportarReportePlaqueados(APIView):
    permission_classes = [AllowAny]

    def replaceColumn(self, column):
        return column.strip().replace(" ", "_").replace("ñ", "n").replace("í", "i").replace("é", "e").replace("ó", "o").lower()

    def post(self, request, format=None):
        file = request.FILES['file']
        excel_file = pd.read_excel(file).rename(
            self.replaceColumn, axis="columns")
        redirect_url = reverse("importar_reporte_plaqueados")
        exitos = 0
        activos_totales = 0

        def format_date(x):
            format = "%d-%m-%y"
            try:
                return datetime.strptime(x, format)
            except:
                return datetime.now()

        for row in excel_file.itertuples(index=False):
            activos_totales += 1
            activo = row._asdict()
            activo_db = models.Activos_Plaqueados()
            activo_db.placa = str(activo["placa"])
            activo_db.nombre = activo["nombre"]
            activo_db.marca = activo["marca"]
            activo_db.modelo = activo["modelo"]
            activo_db.serie = activo["serie"]
            activo_db.valor = activo["valor"]
            activo_db.garantia = format_date(activo["garantia"])
            activo_db.observacion = activo["detalle"]
            activo_db.fecha_ingreso = format_date(activo["fecha_ingreso"])

            tipo_db = models.Tipo.objects.filter(
                nombre__contains=activo["tipo"]).first()
            subtipo_db = models.Subtipo.objects.filter(
                nombre__contains=activo["subtipo"]).first()

            activo_db.tipo = tipo_db
            activo_db.subtipo = subtipo_db
            ubicacion_db = None
            if type(activo["ubicacion"]) == str:
                ubicacion_db = models.Ubicaciones.objects.filter(
                    ubicacion__contains=activo["ubicacion"]).first()
                if(ubicacion_db is None):
                    ubicacion_db = models.Ubicaciones()
                    if type(activo["zona"]) == str:
                        if "esparza" in activo["zona"].lower():
                            ubicacion_db.instalacion = models.Ubicaciones.InstalacionChoices.ESPARZA
                        elif "cocal" in activo["zona"].lower():
                            ubicacion_db.instalacion = models.Ubicaciones.InstalacionChoices.COCAL
                        else:
                            break
                        ubicacion_db.ubicacion = activo["ubicacion"]
                        funcionario_db = models.Funcionarios.objects.filter(
                            nombre_completo__contains=activo["custodio"]).first()
                        if(funcionario_db is not None):
                            ubicacion_db.custodio = funcionario_db
                            ubicacion_db.save()
            if ubicacion_db is not None:
                activo_db.ubicacion = ubicacion_db

            compra_db = None
            if type(activo['numero_orden_de_compra_o_referencia']) is str:
                compra_db = models.Compra.objects.filter(
                    numero_orden_compra__contains=activo['numero_orden_de_compra_o_referencia']).first()

                if compra_db is not None:
                    compra_db = models.Compra()
                    compra_db.numero_orden_compra = activo['numero_orden_de_compra_o_referencia']
                    compra_db.numero_factura = activo["numero_factura"]
                    compra_db.numero_procedimiento = activo["numero_procedimiento"]
                    compra_db.proveedor = activo["nombre_proveedor"]
                    compra_db.telefono_proveedor = activo["telefono_proveedor"]
                    compra_db.correo_proveedor = activo["correo_empresa"]
                    compra_db.detalle = activo["detalles_de_presupuesto"]
                    compra_db.informe_tecnico = activo["informe_tecnico"]
                    compra_db.origen_presupuesto = activo["origen_presupuesto"]
                    compra_db.save()

            if compra_db is not None:
                activo_db.compra = compra_db

            traslado_db = models.Tramites.objects.filter(
                referencia__contains=activo["traslado"]).first()

            if traslado_db is not None:
                activo_db.tramites.add(traslado_db)
            try:
                activo_db.save()
                exitos += 1
            except Exception as ex:
                print(ex)
                pass
        message = f"Se incluyeron {exitos} de {activos_totales} activos totales"
        return redirect(f"{redirect_url}?message={message}")
