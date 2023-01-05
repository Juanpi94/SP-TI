from http.client import HTTPResponse
from io import BytesIO
import json
from math import isnan
import os
import tempfile
from time import sleep
from urllib import request
from django.shortcuts import redirect
from django.urls import reverse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework import status
from rest_framework.response import Response
from backend import models
from backend import serializers
from backend.serializers import CompraSerializer, DeshechoSerializer, FuncionariosSerializer, NoPlaqueadosSerializer, PlaqueadosSerializer, SubtipoSerializer, TipoSerializer, TramitesCreateSerializer, TramitesSerializer, TrasladosSerializer, UbicacionesSerializer, UserSerializer
from rest_framework.decorators import action
import pandas as pd
from django.db.models import Model
from django.core.exceptions import ObjectDoesNotExist
from django.http import FileResponse
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
    filterset_fields = ('serie',)


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

    def create(self, request):

        data = request.data

        activos_ids = data.pop("activos")
        print(data)
        serializer = TramitesCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tramite = self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        activos = models.Activos_Plaqueados.objects.filter(id__in=activos_ids)

        for activo in activos:
            activo.tramite = tramite
            activo.save()
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

    @action(detail=False, methods=['post'])
    def get_destinos(self, request):

        activos_ids = request.data.pop("activos")

        traslados = models.Traslados.objects.filter(activo__in=activos_ids)

        response = []

        for traslado in traslados:
            response.append({
                "destino": traslado.destino.id,
                "activo": traslado.activo.id
            })
        return Response(json.dumps(response), status=status.HTTP_200_OK)

    def get_serializer(self, instance=None, data=None, many=False, partial=False):
        print(data)
        if data is not None:
            return super(TrasladosApiViewset, self).get_serializer(instance=instance, data=data, many=True, partial=partial)
        else:
            return super(TrasladosApiViewset, self).get_serializer(instance=instance, partial=partial)


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
            writer = pd.ExcelWriter(b, engine="openpyxl", mode="xlswriter")
            parsed_json.to_excel(writer)
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
