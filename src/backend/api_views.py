import logging
from io import BytesIO
import pandas as pd
import pandas.errors as pd_errors
from django.db.models import F

from backend import models as mdls
from backend.import_helper import ImportModule
from .models import *
from backend.serializers import *
from django.http import FileResponse, HttpResponseServerError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
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

#-------------# (APIView) #-------------#

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
            activos_data = filtered_df.iloc[:, :17]
            fecha_registro_data = filtered_df.iloc[:, 34]
            compras = filtered_df.iloc[:, 23]
            activos_data["fecha_registro"] = fecha_registro_data
            activos_data["compras"] = compras
            activos_data = activos_data.values
            compras_data = excel_file.iloc[:, 23:33].values

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

class ImportarReporteNoPlaqueados(APIView):
    def post(self, request: Request, format=None):
        if "file" not in request.FILES:
            return Response({"message": "Bad Request"}, 400)
        file = request.FILES["file"]
        update = "update" in request.data

        try:
            excel_file = pd.read_excel(file)
            filtered_df = excel_file.applymap(lambda x: x.strip() if isinstance(x, str) else x)
            filtered_df = filtered_df.query('Placa == "S/P" or Placa == ""')
            activos_data = filtered_df.iloc[:, 1:17]
            fecha_registro_data = filtered_df.iloc[:, 34]
            compras = filtered_df.iloc[:, 23]
            activos_data["fecha_registro"] = fecha_registro_data
            activos_data["compras"] = compras
            activos_data = activos_data.values
            compras_data = excel_file.iloc[:, 23:33].values

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

class GenerarTramiteView(APIView):

    def post(self, request):
        try:
            activos_plaqueados = request.data.pop('activos_plaqueados')
            traslados = request.data.pop('traslados')

            tramite_serializer = TramitesSerializer(
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

#-------------# (APIView) #-------------#

#-------------# (AuthMixin, ModelViewSet) #-------------#

class UserList(AuthMixin, ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class PlaqueadosApiViewset(AuthMixin, ModelViewSet):
    queryset = Activos_Plaqueados.objects.all()
    serializer_class = PlaqueadosSerializer

class NoPlaqueadosApiViewSet(AuthMixin, ModelViewSet):
    queryset = mdls.Activos_No_Plaqueados.objects.all()
    serializer_class = NoPlaqueadosSerializer

    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("serie",)

#----- Tramites acciones -----#
class TramitesApiViewset(AuthMixin, ModelViewSet):
    queryset = mdls.Tramites.objects.all()
    serializer_class = TramitesSerializer
    
class TramiteAPIRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    queryset = Tramites.objects.all()
    serializer_class = TramitesSerializer
#---- Fin Tramites acciones ----#


class DesechoApiViewset(AuthMixin, ModelViewSet):
    queryset = mdls.Desecho.objects.all()
    serializer_class = DesechoSerializer

class TallerApiViewset(AuthMixin, ModelViewSet):
    queryset = mdls.Taller.objects.all()
    serializer_class = TallerSerializer

    # filter_backends = DjangoFilterBackend

class FuncionariosApiViewset(AuthMixin, ModelViewSet):
    queryset = mdls.Funcionarios.objects.all()
    serializer_class = FuncionariosSerializer

class TipoApiViewset(AuthMixin, ModelViewSet):
    queryset = mdls.Tipo.objects.all()
    serializer_class = TipoSerializer

class SubtipoApiViewSet(AuthMixin, ModelViewSet):
    queryset = mdls.Subtipo.objects.all()
    serializer_class = SubtipoSerializer

class UbicacionesApiViewset(AuthMixin, ModelViewSet):
    queryset = mdls.Ubicaciones.objects.all()
    serializer_class = UbicacionesSerializer

class CompraApiViewset(AuthMixin, ModelViewSet):
    queryset = mdls.Compra.objects.all()
    serializer_class = CompraSerializer

class UserApiViewset(AuthMixin, ModelViewSet):
    queryset = mdls.User.objects.all()
    serializer_class = UserSerializer

class RedApiViewset(AuthMixin, ModelViewSet):
    queryset = mdls.Red.objects.all()
    serializer_class = RedSerializer

class ProveedorApiViewset(AuthMixin, ModelViewSet):
    queryset = mdls.Proveedor.objects.all()
    serializer_class = ProveedorSerializer

class UnidadesApiViewset(AuthMixin, ModelViewSet):
    queryset = mdls.Unidades.objects.all()
    serializer_class = UnidadesSerializer

#-------------# (AuthMixin, ModelViewSet) #-------------#

#-------------# Area de Pruebas #-------------#



#-----------# Fin Area de Pruebas #-----------#