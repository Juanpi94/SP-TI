
from dataclasses import field
from django.forms import SlugField
from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from backend.models import Activos_No_Plaqueados, Activos_Plaqueados, Funcionarios, Tipo, Tramites, Traslados, Ubicaciones
from django.contrib.auth.models import User


class DualRelatedField(serializers.RelatedField):
    representation_field = ""
    internal_field = ""

    def __init__(self, representation_field, internal_field="id", **kwargs):
        super().__init__(**kwargs)
        self.representation_field = representation_field or ""
        self.internal_field = internal_field

    def to_representation(self, value):
        return value.__dict__[self.representation_field]

    def to_internal_value(self, data):
        try:
            object = self.get_queryset().get(**{self.internal_field: data})
            return object
        except Exception as err:
            print(err, "err")


class PlaqueadosSerializer(ModelSerializer):
    tramite = serializers.SlugRelatedField(
        slug_field="referencia", queryset=Tramites.objects.all(), required=False)
    ubicacion = serializers.SlugRelatedField(queryset=Ubicaciones.objects.all(
    ), slug_field="nombre", allow_null=True)

    class Meta:
        model = Activos_Plaqueados
        fields = "__all__"


class NoPlaqueadosSerializer(ModelSerializer):
    tramite = serializers.SlugRelatedField(
        slug_field="referencia", queryset=Tramites.objects.all(), required=False)
    ubicacion = serializers.SlugRelatedField(queryset=Ubicaciones.objects.all(
    ), slug_field="nombre", allow_null=True)

    class Meta:
        model = Activos_No_Plaqueados
        fields = "__all__"


class TramitesSerializer(ModelSerializer):
    activos = PlaqueadosSerializer(many=True, required=False)
    solicitante = serializers.SlugRelatedField(
        slug_field="username", queryset=User.objects.all())
    recipiente = serializers.SlugRelatedField(
        slug_field="nombre_completo", queryset=Funcionarios.objects.all())
    remitente = serializers.SlugRelatedField(
        slug_field="nombre_completo", queryset=Funcionarios.objects.all())

    class Meta:
        model = Tramites
        fields = "__all__"


class TramitesCreateSerializer(ModelSerializer):
    activos = PlaqueadosSerializer(many=True, required=False)
    recipiente = serializers.SlugRelatedField(
        slug_field="nombre_completo", queryset=Funcionarios.objects.all())
    remitente = serializers.SlugRelatedField(
        slug_field="nombre_completo", queryset=Funcionarios.objects.all())

    class Meta:
        model = Tramites
        fields = "__all__"


class FuncionariosSerializer(ModelSerializer):
    class Meta:
        model = Funcionarios
        fields = "__all__"


class UbicacionesSerializer(ModelSerializer):
    custodio = serializers.SlugRelatedField(
        slug_field="nombre_completo", queryset=Funcionarios.objects.all())

    class Meta:
        model = Ubicaciones
        fields = "__all__"


class TrasladosSerializer(ModelSerializer):

    activo = serializers.PrimaryKeyRelatedField(
        queryset=Activos_Plaqueados.objects.all())

    class Meta:
        model = Traslados
        fields = "__all__"
class TipoSerializer(ModelSerializer):

    class Meta:
        model =Tipo
        fields = "__all__"