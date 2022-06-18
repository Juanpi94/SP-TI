 
from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from backend.models import Activos_Plaqueados, Funcionarios, Tramites, Traslados, Ubicaciones
from django.contrib.auth.models import User

class DualRelatedField(serializers.RelatedField):
    representation_field = ""
    internal_field = "id"

    def __init__(self, representation_field, internal_field="id", **kwargs):
        super().__init__(**kwargs)
        self.representation_field = representation_field or ""
        self.internal_field = internal_field

    def to_representation(self, value):
        return value.__dict__[self.representation_field]
    def to_internal_value(self, data):
        object = self.get_queryset().get(**{self.internal_field: data})
        return object


class PlaqueadosSerializer(ModelSerializer):
    tramite = serializers.SlugRelatedField(slug_field="referencia", queryset= Tramites.objects.all(), required=False)
    ubicacion = DualRelatedField(required=False, queryset=Ubicaciones.objects.all(), representation_field="lugar")
    class Meta:
        model = Activos_Plaqueados
        fields = "__all__"

class PlaqueadosRetrieveSerializer(PlaqueadosSerializer):
    ubicacion = serializers.PrimaryKeyRelatedField(read_only=True)

    
class TramitesSerializer(ModelSerializer):
    activos = PlaqueadosSerializer(many=True, required=False)
    solicitante = DualRelatedField(representation_field="username", queryset=User.objects.all())
    recipiente = DualRelatedField(representation_field="nombre_completo", queryset=Funcionarios.objects.all())
    remitente = DualRelatedField(representation_field="nombre_completo", queryset=Funcionarios.objects.all())
    class Meta:
        model = Tramites
        fields = "__all__"

class TramitesRetrieveSerializer(TramitesSerializer):
    solicitante = serializers.PrimaryKeyRelatedField(read_only=True)
    remitente = serializers.PrimaryKeyRelatedField(read_only=True)
    recipiente = serializers.PrimaryKeyRelatedField(read_only=True)

class TrasladosSerializer(ModelSerializer):

    activo = serializers.PrimaryKeyRelatedField(queryset=Activos_Plaqueados.objects.all())

    class Meta:
        model = Traslados
        fields = "__all__"
