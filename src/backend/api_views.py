from datetime import datetime
from http.client import HTTPResponse

from io import BytesIO
import json
from math import isnan

from django.http import FileResponse
from django.shortcuts import redirect
from django.urls import reverse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request
from backend import models
from backend.serializers import CompraSerializer, DeshechoSerializer, FuncionariosSerializer, NoPlaqueadosSerializer, \
    PlaqueadosSerializer, ProveedorSerializer, RedSerializer, SubtipoSerializer, TallerSerializer, TipoSerializer, \
    TramitesCreateSerializer, TramitesSerializer, TramitesUpdateSerializer, TrasladosSerializer, UbicacionesSerializer, \
    UnidadSerializer, UserSerializer, PlaqueadosCreateSerializer
from rest_framework.decorators import action
import pandas as pd
from django.core.exceptions import ObjectDoesNotExist
import pandas.io.formats.excel
from backend.import_helper import ImportModule


# ModelViewset con la capacidad de especificar más de un serializador, dependiendo de la acción


class CustomModelViewset(ModelViewSet):
    retrieve_serializer = None

    def get_serializer_class(self):
        if self.action == "retrieve":
            return self.retrieve_serializer
        else:
            return self.serializer_class


class AuthMixin:
    permission_classes = [IsAuthenticated]


class PlaqueadosApiViewset(AuthMixin, ModelViewSet):
    queryset = models.Activos_Plaqueados.objects.all()

    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ('serie', "placa")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PlaqueadosSerializer
        else:
            return PlaqueadosCreateSerializer


class NoPlaqueadosApiViewSet(AuthMixin, ModelViewSet):
    queryset = models.Activos_No_Plaqueados.objects.all()
    serializer_class = NoPlaqueadosSerializer

    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ('serie',)


class TramitesApiViewset(AuthMixin, ModelViewSet):
    queryset = models.Tramites.objects.all()
    serializer_class = TramitesSerializer

    def add_activos_to_tramite(self, data, tramite):
        activos_plaqueados = data.pop("activosPlaqueados")
        activos_no_plaqueados = data.pop("activosNoPlaqueados")
        for activo in activos_plaqueados:
            activo_db = models.Activos_Plaqueados.objects.get(id=activo)
            activo_db.tramites.add(tramite)
            if tramite.tipo == models.Tramites.TiposTramites.DESHECHO:
                activo_db.estado = models.Activo.Estados.PROCESO_DESHECHO
            activo_db.save()

            if tramite.tipo == models.Tramites.TiposTramites.TRASLADO:
                traslados = data['traslados']
                plaqueados = list(filter(lambda traslado: traslado["tipo"] ==
                                                          "PLAQUEADO" and traslado["activo"] == activo_db.id,
                                         traslados))

                if len(plaqueados) == 0:
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
            if tramite.tipo == models.Tramites.TiposTramites.DESHECHO:
                activo_db.estado = models.Activo.Estados.PROCESO_DESHECHO
            activo_db.save()

            if tramite.tipo == models.Tramites.TiposTramites.TRASLADO:
                traslados = data['traslados']
                no_plaqueados = list(filter(lambda traslado: traslado["tipo"] ==
                                                             "NO_PLAQUEADO" and traslado["activo"] == activo_db.id,
                                            traslados))
                if len(no_plaqueados) != 0:
                    pass
                else:
                    continue
                traslado = no_plaqueados[0]
                traslado_db = models.Traslados()
                traslado_db.destino = models.Ubicaciones.objects.get(
                    id=traslado["destino"])
                traslado_db.tramite = tramite
                traslado_db.detalle = "No Plaqueado: " + activo_db.serie
                traslado_db.save()
        pass

    def get_serializer_class(self):
        if self.request.method == "PUT":
            return TramitesUpdateSerializer
        if self.request.method == "POST":
            return TramitesCreateSerializer
        return super().get_serializer_class()

    def perform_update(self, serializer: TramitesSerializer):

        anterior = models.Tramites.objects.filter(
            referencia=serializer.validated_data["referencia"]).first()

        if anterior is None:
            serializer.validated_data["estado"] = models.Tramites.TiposEstado.PENDIENTE
            return serializer.save(
                solicitante=self.request.user)

        estado_anterior = anterior.estado

        tramite: models.Tramites = serializer.save(
            solicitante=self.request.user)

        tramite.activos_plaqueados_set.clear()
        tramite.activos_no_plaqueados_set.clear()
        self.add_activos_to_tramite(self.request.data, tramite)
        if tramite.estado == tramite.TiposEstado.FINALIZADO and estado_anterior == tramite.TiposEstado.PENDIENTE:
            if tramite.tipo == tramite.TiposTramites.TRASLADO:
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

            elif tramite.tipo == tramite.TiposTramites.DESHECHO:
                for activo_plaqueado in tramite.activos_plaqueados_set.all():
                    activo_plaqueado.estado = models.Activo.Estados.DESHECHO
                    activo_plaqueado.save()
                for activo_no_plaqueado in tramite.activos_no_plaqueados_set.all():
                    activo_no_plaqueado.estado = models.Activo.Estados.DESHECHO
                    activo_no_plaqueado.save()

        return tramite

    def create(self, request: Request):
        data = request.data
        taller = None
        if data.get("taller"):
            taller = data.pop("taller")

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        tramite = self.perform_create(serializer)

        if tramite.tipo == models.Tramites.TiposTramites.TALLER and taller:
            taller_db = models.Taller()
            taller_db.beneficiario = taller.get("beneficiario")
            taller_db.destinatario = taller.get("destinatario")
            taller_db.autor = taller.get("autor")
            taller_db.tramite = tramite
            taller_db.save()

        if tramite.tipo == models.Tramites.TiposTramites.DESHECHO:
            deshecho_db = models.Deshecho()
            deshecho_db.tramite = tramite
            deshecho_db.save()

        self.add_activos_to_tramite(data, tramite)
        headers = self.get_success_headers(serializer.data)

        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        return serializer.save()


class DeshechoApiViewset(AuthMixin, ModelViewSet):
    queryset = models.Deshecho.objects.all()
    serializer_class = DeshechoSerializer


class TrasladosApiViewset(AuthMixin, ModelViewSet):
    queryset = models.Traslados.objects.all()
    serializer_class = TrasladosSerializer

    filter_backends = (DjangoFilterBackend,)


class TallerApiViewset(AuthMixin, ModelViewSet):
    queryset = models.Taller.objects.all()
    serializer_class = TallerSerializer

    filter_backends = DjangoFilterBackend


class FuncionariosApiViewset(AuthMixin, ModelViewSet):
    queryset = models.Funcionarios.objects.all()
    serializer_class = FuncionariosSerializer


class TipoApiViewset(AuthMixin, ModelViewSet):
    queryset = models.Tipo.objects.all()
    serializer_class = TipoSerializer


class SubtipoApiViewSet(AuthMixin, ModelViewSet):
    queryset = models.Subtipo.objects.all()
    serializer_class = SubtipoSerializer


class UbicacionesApiViewset(AuthMixin, ModelViewSet):
    queryset = models.Ubicaciones.objects.all()
    serializer_class = UbicacionesSerializer


class CompraApiViewset(AuthMixin, ModelViewSet):
    queryset = models.Compra.objects.all()
    serializer_class = CompraSerializer


class UserApiViewset(AuthMixin, ModelViewSet):
    queryset = models.User.objects.all()
    serializer_class = UserSerializer


class RedApiViewset(AuthMixin, ModelViewSet):
    queryset = models.Red.objects.all()
    serializer_class = RedSerializer


class ProveedorApiViewset(AuthMixin, ModelViewSet):
    queryset = models.Proveedor.objects.all()
    serializer_class = ProveedorSerializer


class UnidadApiViewset(AuthMixin, ModelViewSet):
    queryset = models.Unidad.objects.all()
    serializer_class = UnidadSerializer


class ExportarHojaDeCalculo(APIView):

    def post(self, request, format=None):
        json_data = request.data

        parsed_json = pd.DataFrame(json_data)
        b = BytesIO()
        writer = pd.ExcelWriter(b, engine="xlsxwriter", mode="xlswriter")
        pandas.io.formats.excel.header_style = None
        parsed_json.to_excel(writer, sheet_name="Reporte")
        worksheet = writer.sheets["Reporte"]
        workbook = writer.book
        worksheet.autofit()
        header_fmt = workbook.add_format(
            {"bold": True, "fg_color": "#FCD5B4"})

        for col_num, value in enumerate(parsed_json.columns.values):
            worksheet.write(
                0, col_num + 1, value.replace(" ", "").replace("_", " ").strip(), header_fmt)
        writer.save()
        b.seek(0)
        response = FileResponse(b, filename="export.xlsx", as_attachment=True)
        return response


class ChangePasswordView(APIView):

    def post(self, request, format=None):
        json_data = request.data

        password = json_data['password']
        request.user.set_password(password)
        request.user.save()
        return Response(None, status.HTTP_202_ACCEPTED)


class ImportarReportePlaqueados(APIView):

    def post(self, request: Request, format=None):
        if "file" not in request.FILES:
            return Response({"message": "Bad Request"}, 400)
        file = request.FILES['file']
        update = "update" in request.data
        excel_file = pd.read_excel(file)
        activos_data = excel_file.iloc[:, :16]
        fecha_registro_data = excel_file.iloc[:, 33]
        compras = excel_file.iloc[:, 22]

        activos_data["fecha_registro"] = fecha_registro_data
        activos_data["compras"] = compras
        activos_data = activos_data.values
        compras_data = excel_file.iloc[:, 21:32].values

        summary = {}
        compras_summary = ImportModule.import_compras(compras_data, update)
        activos_summary = ImportModule.import_activos(activos_data, update)
        summary["Activos_Plaqueados"] = activos_summary
        summary["Compras"] = compras_summary
        return Response(summary, 200)
