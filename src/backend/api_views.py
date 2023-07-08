from datetime import datetime

from io import BytesIO
import json
from math import isnan

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
            if (tramite.tipo == models.Tramites.TiposTramites.DESHECHO):
                activo_db.estado = models.Activo.Estados.PROCESO_DESHECHO
            activo_db.save()

            if (tramite.tipo == models.Tramites.TiposTramites.TRASLADO):
                traslados = data['traslados']
                plaqueados = list(filter(lambda traslado: traslado["tipo"] ==
                                                          "PLAQUEADO" and traslado["activo"] == activo_db.id,
                                         traslados))

                if (len(plaqueados) == 0):
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
            if (tramite.tipo == models.Tramites.TiposTramites.DESHECHO):
                activo_db.estado = models.Activo.Estados.PROCESO_DESHECHO
            activo_db.save()

            if (tramite.tipo == models.Tramites.TiposTramites.TRASLADO):
                traslados = data['traslados']
                no_plaqueados = list(filter(lambda traslado: traslado["tipo"] ==
                                                             "NO_PLAQUEADO" and traslado["activo"] == activo_db.id,
                                            traslados))
                if (len(no_plaqueados) == 0):
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
        if (self.request.method == "PUT"):
            return TramitesUpdateSerializer
        if (self.request.method == "POST"):
            return TramitesCreateSerializer
        return super().get_serializer_class()

    def perform_update(self, serializer: TramitesSerializer):

        anterior = models.Tramites.objects.filter(
            referencia=serializer.validated_data["referencia"]).first()

        if (anterior is None):
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

    filter_backends = (DjangoFilterBackend)


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


class ImportarActivosApiView(APIView):
    columns = ["nombre", "placa", "detalle", "marca",
               "serie", "valor", "modelo", "garantia", "ubicacion"]

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
                if (type(value) == float and isnan(value) and item not in self.optional_columns):
                    message = f'Error al importar activos, asegurese que el campo {item} tenga valores'
                    error = True
                    return redirect(f"{redirect_url}?message={message}&error={error}")

            if (row_dict['ubicacion']):
                try:
                    row_dict['ubicacion'] = models.Ubicaciones.objects.get(
                        nombre__icontains=row_dict['ubicacion'])
                except ObjectDoesNotExist:
                    activos_erroneos.append(
                        f"{row_dict['nombre']} : {row_dict['placa']}")

                    skip_current = True
            for optional_column in self.optional_columns:
                if (type(row_dict[optional_column]) == float and isnan(row_dict[optional_column])):
                    row_dict.pop(optional_column)

            if (not skip_current):
                self.model.objects.create(**row_dict)
                success_number += 1
            skip_current = False
        error = False
        message = f"{success_number} activos importados con éxito, {activos_erroneos.__len__()} activos érroneos: {', '.join(activos_erroneos) if activos_erroneos.__len__() else 'No hubieron errores'}"
        return redirect(f"{redirect_url}?message={message}&error={error}")


class ImportarActivosNoPlaqueadosApiView(APIView):
    columns = ["nombre", "detalle", "marca",
               "serie", "valor", "modelo", "garantia", "ubicacion"]

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
                if (type(value) == float and isnan(value) and item not in self.optional_columns):
                    message = f'Error al importar activos, asegurese que el campo {item} tenga valores'
                    error = True
                    return redirect(f"{redirect_url}?message={message}&error={error}")

            if (row_dict['ubicacion']):
                try:
                    row_dict['ubicacion'] = models.Ubicaciones.objects.get(
                        nombre__icontains=row_dict['ubicacion'])
                except ObjectDoesNotExist:
                    activos_erroneos.append(
                        f"{row_dict['nombre']} : {row_dict['placa']}")

                    skip_current = True
            for optional_column in self.optional_columns:
                if (type(row_dict[optional_column]) == float and isnan(row_dict[optional_column])):
                    row_dict.pop(optional_column)

            if (not skip_current):
                self.model.objects.create(**row_dict)
                success_number += 1
            skip_current = False
        error = False
        message = f"{success_number} activos importados con éxito, {activos_erroneos.__len__()} activos érroneos: {', '.join(activos_erroneos) if activos_erroneos.__len__() else 'No hubieron errores'}"
        return redirect(f"{redirect_url}?message={message}&error={error}")


class ExportarHojaDeCalculo(APIView):

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
                worksheet.write(
                    0, col_num + 1, value.replace(" ", "").replace("_", " ").strip(), header_fmt)
            writer.save()
            return Response({"data": b.getbuffer().hex()})


class ChangePasswordView(APIView):

    def post(self, request, format=None):
        json_data = request.data

        password = json_data['password']
        request.user.set_password(password)
        request.user.save()
        return Response(None, status.HTTP_202_ACCEPTED)


class ImportarReportePlaqueados(APIView):

    def replaceColumn(self, column):
        return column.strip().replace(" ", "_").replace("ñ", "n").replace("í", "i").replace("é", "e").replace("ó",
                                                                                                              "o").lower()

    def post(self, request: Request, format=None):
        file = request.FILES['file']
        excel_file = pd.read_excel(file, na_values=["Sin Placa", "Sin placa", "sin placa", "Pendiente"]).rename(
            self.replaceColumn, axis="columns")
        redirect_url = reverse("importar_reporte_plaqueados")
        exitos = 0
        activos_totales = len(excel_file)

        def format_date(x):
            format = "%d-%m-%y"
            try:
                return datetime.strptime(x, format)
            except:
                return datetime.now()

        for row in excel_file.itertuples(index=False):

            activo = row._asdict()

            if models.Activos_Plaqueados.objects.filter(
                    placa=activo["placa"]).first() is not None or models.Activos_No_Plaqueados.objects.filter(
                serie=activo["serie"]).first() is not None:
                continue

            activo_db = None
            if pd.isnull(activo["placa"]):
                activo_db = models.Activos_No_Plaqueados()
            else:
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

            if pd.isnull(activo["ubicacion"]) is False:
                ubicacion_db = models.Ubicaciones.objects.filter(
                    ubicacion__icontains=activo["ubicacion"]).first()

                if ubicacion_db is None:

                    ubicacion_db = models.Ubicaciones()
                    if pd.isnull(activo["zona"]) is False:
                        if "esparza" in activo["zona"].lower():
                            ubicacion_db.instalacion = models.Ubicaciones.InstalacionChoices.ESPARZA
                        elif "cocal" in activo["zona"].lower():
                            ubicacion_db.instalacion = models.Ubicaciones.InstalacionChoices.COCAL
                        else:
                            continue
                        ubicacion_db.ubicacion = activo["ubicacion"]

                        if pd.isnull(activo["custodio"]) is False:
                            nombre = " ".join(
                                activo["custodio"].split(" ")[:2])

                            funcionario_db = models.Funcionarios.objects.filter(
                                nombre_completo__icontains=nombre).first()

                            if funcionario_db is not None:
                                ubicacion_db.custodio = funcionario_db
                            else:
                                funcionario_db = models.Funcionarios()
                                funcionario_db.cedula = "PENDIENTE"
                                funcionario_db.nombre_completo = activo["custodio"]
                                funcionario_db.save()
                                ubicacion_db.custodio = funcionario_db

                            ubicacion_db.save()
                        else:
                            ubicacion_db = None
                    else:
                        ubicacion_db = None
            if ubicacion_db is not None:
                activo_db.ubicacion = ubicacion_db

            compra_db = None
            if pd.isnull(activo['numero_orden_de_compra_o_referencia']) is False:
                compra_db = models.Compra.objects.filter(
                    numero_orden_compra=activo['numero_orden_de_compra_o_referencia']).first()

                if compra_db is not None:
                    compra_db = models.Compra()

                    compra_db.numero_orden_compra = activo['numero_orden_de_compra_o_referencia']
                    compra_db.numero_factura = activo["numero_factura"]
                    compra_db.numero_procedimiento = activo["numero_procedimiento"]

                    if pd.isnull(activo["nombre_proveedor"]) is False:
                        proveedor_db = models.Proveedor.objects.filter(
                            nombre=activo["nombre_proveedor"]).first()
                        if proveedor_db is None:
                            proveedor_db = models.Proveedor()
                            proveedor_db.nombre = activo["nombre_proveedor"]
                            proveedor_db.telefono = activo["telefono_proveedor"]
                            proveedor_db.correo = activo["correo_empresa"]
                            proveedor_db.save()
                        compra_db.proveedor = proveedor_db

                    compra_db.detalle = activo["detalles_de_presupuesto"]
                    compra_db.informe_tecnico = activo["informe_tecnico"]
                    compra_db.origen_presupuesto = activo["origen_presupuesto"]
                    compra_db.save()

            if compra_db is not None:
                activo_db.compra = compra_db

            traslado_db = models.Tramites.objects.filter(
                referencia=activo["traslado"]).first()

            if traslado_db is not None:
                activo_db.tramites.add(traslado_db)

            red_db = None
            if pd.isnull(activo["mac"]) is False:

                red_db = models.Red.objects.filter(MAC=activo["mac"]).first()

                if red_db is None:
                    red_db = models.Red()
                    red_db.MAC = activo["mac"] or ""
                    red_db.IP = activo["ip"] or ""
                    red_db.IP_switch = activo["ip_switch"] or ""
                    red_db.save()

            if red_db is not None:
                activo_db.red = red_db
            try:
                activo_db.save()
                exitos += 1
            except Exception as ex:
                print(ex)
                continue
        message = f"Se incluyeron {exitos} de {activos_totales} activos totales"
        return redirect(f"{redirect_url}?message={message}")
