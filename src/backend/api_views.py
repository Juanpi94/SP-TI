import json
from math import isnan
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
from backend.serializers import PlaqueadosRetrieveSerializer, PlaqueadosSerializer, TramitesRetrieveSerializer, TramitesSerializer, TrasladosSerializer
from rest_framework.decorators import action
from pandas import isna, read_excel
from django.db.models import Model
# ModelViewset con la capacidad de especificar más de un serializador, dependiendo de la acción


class CustomModelViewset(ModelViewSet):
    retrieve_serializer = None

    def get_serializer_class(self):
        if(self.action == "retrieve"):
            return self.retrieve_serializer
        else:
            return self.serializer_class


class PlaqueadosApiViewset(CustomModelViewset):
    queryset = models.Activos_Plaqueados.objects.all()
    serializer_class = PlaqueadosSerializer
    retrieve_serializer = PlaqueadosRetrieveSerializer
    permission_classes = [AllowAny]
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ('serie',)


class TramitesApiViewset(CustomModelViewset):
    queryset = models.Tramites.objects.all()
    serializer_class = TramitesSerializer
    retrieve_serializer = TramitesRetrieveSerializer
    permission_classes = [AllowAny]

    def create(self, request):
        data = request.data

        activos_ids = data.pop("activos")

        serializer = self.get_serializer(data=request.data)
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


class ImportView(APIView):
    message = "",
    columns = [],
    optional_columns = []
    target = ""
    model: Model = None

    def post(self, request, format=None):

        file = request.FILES['file']
        excel_file = read_excel(file, usecols=self.columns)

        redirect_url = reverse(self.target)

        for row in excel_file.itertuples(index=False):
            row_dict = row._asdict()
            for item in row_dict:
                value = row_dict[item]

                if(type(value) == float and isnan(value) and item not in self.optional_columns):
                    message = self.get_error_message(item, value)
                    error = True
                    return redirect(f"{redirect_url}?message={message}&error={error}")

            for optional_column in self.optional_columns:
                if(type(row_dict[optional_column]) == float and isnan(row_dict[optional_column])):
                    row_dict.pop(optional_column)
            self.model.objects.create(**row_dict)
        error = False
        return redirect(f"{redirect_url}?message={self.message}&error={error}")

    def get_error_message(self, field, value):
        return "error"


class ImportarActivosApiView(ImportView):
    permission_classes = [AllowAny]
    columns = ["nombre", "placa", "detalle", "marca",
               "serie",	"valor", "modelo", "garantia", "ubicacion"]
    target = "importar-activos"
    optional_columns = ['ubicacion', 'garantia']
    model = models.Activos_Plaqueados
    message = "Activos importados con éxito"

    def get_error_message(self, field, value):
        return f'Error al importar activos, asegurese que el campo {field} tenga valores'
