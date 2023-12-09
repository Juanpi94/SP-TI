import logging
import traceback
from io import BytesIO
import pandas as pd
import pandas.errors as pd_errors
from backend import models
from backend.import_helper import ImportModule
from backend.models import Activos_Plaqueados, Ubicaciones, Traslados
from backend.serializers import (CompraSerializer, DeshechoSerializer,
                                 FuncionariosSerializer,
                                 NoPlaqueadosSerializer,
                                 PlaqueadosCreateSerializer,
                                 PlaqueadosSerializer, ProveedorSerializer,
                                 RedSerializer, SubtipoSerializer,
                                 TallerSerializer, TipoSerializer,
                                 TramitesCreateSerializer, TramitesSerializer,
                                 TramitesUpdateSerializer, TrasladosSerializer,
                                 UbicacionesSerializer, UnidadSerializer,
                                 UserSerializer)
from django.http import FileResponse, HttpResponseServerError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

logger = logging.getLogger("atic.errors")


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
    filterset_fields = ("serie", "placa")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PlaqueadosSerializer
        else:
            return PlaqueadosCreateSerializer


class NoPlaqueadosApiViewSet(AuthMixin, ModelViewSet):
    queryset = models.Activos_No_Plaqueados.objects.all()
    serializer_class = NoPlaqueadosSerializer

    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("serie",)


class GenerarTramiteView(APIView):

    def post(self, request):
        try:

            activos_plaqueados = request.data.pop('activos_plaqueados')
            traslados = request.data.pop('traslados')

            tramite_serializer = TramitesCreateSerializer(
                data=request.data, context={"request": request})
            try:
                tramite_serializer.is_valid(raise_exception=True)
            except Exception as e:
                return Response(e.get_codes(), status=status.HTTP_400_BAD_REQUEST)
            tramite = tramite_serializer.save()

            plaqueados = Activos_Plaqueados.objects.filter(
                placa__in=activos_plaqueados)

            for plaqueado in plaqueados:
                ubicacion_id = traslados["plaqueados"].get(plaqueado.placa)

                if ubicacion_id == None:
                    return Response("Didn't found destiny for plaqueado " + plaqueado.placa,
                                    status=status.HTTP_400_BAD_REQUEST)

                traslado_db = Traslados()
                ubicacion = Ubicaciones.objects.get(id=ubicacion_id)

                traslado_db.destino = ubicacion
                traslado_db.detalle = plaqueado.placa
                traslado_db.tramite = tramite
                plaqueado.ubicacion_anterior = plaqueado.ubicacion
                plaqueado.ubicacion = ubicacion

                plaqueado.tramites.add(tramite)

            return Response("Tramite created succesfully", status=status.HTTP_201_CREATED)

            # return Response(tramite_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Registra la excepción para su análisis
            logger.error("Couldn't generate tramite", exc_info=e)
            return HttpResponseServerError()


class TramitesApiViewset(AuthMixin, ModelViewSet):
    queryset = models.Tramites.objects.all()
    serializer_class = TramitesSerializer

    def add_activos_to_tramite(self, data, tramite):
        pass

    def get_serializer_class(self):
        if self.request.method == "PUT":
            return TramitesUpdateSerializer
        if self.request.method == "POST":
            return TramitesCreateSerializer
        return super().get_serializer_class()

    def perform_update(self, serializer: TramitesSerializer):
        if type(serializer.validated_data) is not dict:
            return
        anterior = models.Tramites.objects.filter(
            referencia=serializer.validated_data["referencia"]
        ).first()

        if anterior is None:
            serializer.validated_data["estado"] = models.Tramites.TiposEstado.PENDIENTE
            return serializer.save(solicitante=self.request.user)

        estado_anterior = anterior.estado

        tramite: models.Tramites = serializer.save(solicitante=self.request.user)

        tramite.activos_plaqueados_set.clear()
        tramite.activos_no_plaqueados_set.clear()
        self.add_activos_to_tramite(self.request.data, tramite)
        if (
                tramite.estado == tramite.TiposEstado.FINALIZADO
                and estado_anterior == tramite.TiposEstado.PENDIENTE
        ):
            if tramite.tipo == tramite.TiposTramites.TRASLADO:
                for activo_plaqueado in tramite.activos_plaqueados_set.all():
                    activo_plaqueado.ubicacion_anterior = activo_plaqueado.ubicacion
                    activo_plaqueado.ubicacion = (
                        models.Traslados.objects.filter(
                            detalle__contains=activo_plaqueado.placa
                        )
                        .first()
                        .destino
                    )

                    activo_plaqueado.save()
                for activo_no_plaqueado in tramite.activos_no_plaqueados_set.all():
                    activo_no_plaqueado.ubicacion_anterior = (
                        activo_no_plaqueado.ubicacion
                    )
                    activo_no_plaqueado.ubicacion = (
                        models.Traslados.objects.filter(
                            detalle__contains=activo_no_plaqueado.serie
                        )
                        .first()
                        .destino
                    )
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

        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

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
        pd.io.formats.excel.header_style = None
        parsed_json.to_excel(writer, sheet_name="Reporte")
        worksheet = writer.sheets["Reporte"]
        workbook = writer.book
        worksheet.autofit()
        header_fmt = workbook.add_format({"bold": True, "fg_color": "#FCD5B4"})

        for col_num, value in enumerate(parsed_json.columns.values):
            worksheet.write(
                0,
                col_num + 1,
                value.replace(" ", "").replace("_", " ").strip(),
                header_fmt,
            )
        writer.save()
        b.seek(0)
        response = FileResponse(b, filename="export.xlsx", as_attachment=True)
        return response


class ChangePasswordView(APIView):
    def post(self, request, format=None):
        json_data = request.data

        password = json_data["password"]
        request.user.set_password(password)
        request.user.save()
        return Response(None, status.HTTP_202_ACCEPTED)


class ImportarReportePlaqueados(APIView):
    def post(self, request: Request, format=None):
        if "file" not in request.FILES:
            return Response({"message": "Bad Request"}, 400)
        file = request.FILES["file"]
        update = "update" in request.data

        try:
            excel_file = pd.read_excel(file)
            filtered_df = excel_file.applymap(lambda x: x.strip() if isinstance(x, str) else x)
            filtered_df = filtered_df.query('Placa != "S/P" and Placa != ""')
            activos_data = filtered_df.iloc[:, :16]
            fecha_registro_data = filtered_df.iloc[:, 33]
            compras = filtered_df.iloc[:, 22]
            activos_data["fecha_registro"] = fecha_registro_data
            activos_data["compras"] = compras
            activos_data = activos_data.values
            compras_data = excel_file.iloc[:, 21:32].values

            summary = {}
            compras_summary = ImportModule.import_compras(compras_data, update)
            activos_summary = ImportModule.import_activos(activos_data, update)
            summary["Activos_Plaqueados"] = activos_summary
            summary["Compras"] = compras_summary
        except pd_errors.ParserError as e:
            logger.error("Couldn't parse excel file", exc_info=e)
            return HttpResponseServerError()
        except Exception as e:
            logger.error("Unexpected error when reading excel file", exc_info=e)
            return HttpResponseServerError()
        return Response(summary, 200)
