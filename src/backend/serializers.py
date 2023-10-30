from dataclasses import field
from django.forms import SlugField
from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from backend.models import Activos_No_Plaqueados, Activos_Plaqueados, Compra, Deshecho, Funcionarios, Proveedor, \
    Subtipo, Taller, Tipo, Tramites, Traslados, Ubicaciones, Red, Unidad
from django.contrib.auth.models import User, Group


class PlaqueadosSerializer(ModelSerializer):
    tramites = serializers.PrimaryKeyRelatedField(many=True, queryset=Tramites.objects.all())

    class Meta:
        model = Activos_Plaqueados
        fields = "__all__"


class PlaqueadosCreateSerializer(ModelSerializer):
    tramites = serializers.PrimaryKeyRelatedField(many=True, required=False, queryset=Tramites.objects.all())

    def to_representation(self, instance):
        return {
            "id": instance.id,
            "nombre": instance.nombre,
            "tipo__nombre": instance.tipo.nombre,
            "subtipo__nombre": instance.subtipo.nombre if instance.subtipo else None,
            "ubicacion__ubicacion": instance.ubicacion.ubicacion if instance.ubicacion else None,
            "marca": instance.marca,
            "valor": instance.valor,
            "garantia": instance.garantia,
            "observacion": instance.observacion
        }

    class Meta:
        model = Activos_Plaqueados
        fields = "__all__"


class NoPlaqueadosSerializer(ModelSerializer):
    tramites = serializers.SlugRelatedField(
        slug_field="referencia", queryset=Tramites.objects.all(), required=False, many=True)
    ubicacion = serializers.SlugRelatedField(queryset=Ubicaciones.objects.all(
    ), slug_field="ubicacion", allow_null=True)

    class Meta:
        model = Activos_No_Plaqueados
        fields = "__all__"


class TrasladosSerializer(ModelSerializer):
    tramite = serializers.SlugRelatedField(
        queryset=Tramites.objects.all(), slug_field="referencia")
    destino_proximo = serializers.SlugRelatedField(
        slug_field="ubicacion", source="destino", read_only=True)
    activos_plaqueados = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='placa', source="tramite.activos_plaqueados_set")

    activos_no_plaqueados = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='serie', source="tramite.activos_no_plaqueados_set")

    class Meta:
        model = Traslados
        fields = "__all__"


class TallerSerializer(ModelSerializer):
    activos_plaqueados = serializers.PrimaryKeyRelatedField(
        queryset=Activos_Plaqueados.objects.all(), many=True, allow_null=True)
    activos_no_plaqueados = serializers.PrimaryKeyRelatedField(
        queryset=Activos_No_Plaqueados.objects.all(), many=True, allow_null=True)

    class Meta:
        model = Taller
        fields = "__all__"


class TallerSerializerRel(ModelSerializer):
    class Meta:
        model = Taller
        fields = "__all__"


class TramitesSerializer(ModelSerializer):
    activos_plaqueados = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='placa', source="activos_plaqueados_set")

    activos_no_plaqueados = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='serie', source="activos_no_plaqueados_set")
    solicitante = serializers.SlugRelatedField(
        slug_field="username", queryset=User.objects.all())
    recipiente = serializers.SlugRelatedField(
        slug_field="nombre_completo", queryset=Funcionarios.objects.all())
    remitente = serializers.SlugRelatedField(
        slug_field="nombre_completo", queryset=Funcionarios.objects.all())
    solicitante = serializers.SlugRelatedField(
        slug_field="username", queryset=User.objects.all())
    taller = TallerSerializerRel(read_only=True)
    traslados = TrasladosSerializer(many=True, read_only=True)

    class Meta:
        model = Tramites
        fields = "__all__"


class TramitesUpdateSerializer(ModelSerializer):
    activos_plaqueados = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='placa', source="activos_plaqueados_set")

    activos_no_plaqueados = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='serie', source="activos_no_plaqueados_set")
    solicitante = serializers.SlugRelatedField(
        slug_field="username", queryset=User.objects.all())
    recipiente = serializers.SlugRelatedField(
        slug_field="nombre_completo", queryset=Funcionarios.objects.all(), required=False)
    remitente = serializers.SlugRelatedField(
        slug_field="nombre_completo", queryset=Funcionarios.objects.all(), required=False)

    solicitante = serializers.HiddenField(
        default=serializers.CurrentUserDefault())

    def validate_recipiente(self, value):

        if "tipo" in dict.keys(self.initial_data) and self.initial_data[
            "tipo"] == Tramites.TiposTramites.DESHECHO and value == None:
            return value
        elif value == "" or value is None:
            raise serializers.ValidationError(
                "El recipiente no puede estar vacio")

    def validate_remitente(self, value):

        if "tipo" in dict.keys(self.initial_data) and self.initial_data["tipo"] == Tramites.TiposTramites.DESHECHO:
            return ""
        elif value == "" or value is None:
            raise serializers.ValidationError(
                "El remitente no puede estar vacio")

    class Meta:
        model = Tramites
        fields = "__all__"


class TramitesCreateSerializer(ModelSerializer):
    recipiente = serializers.SlugRelatedField(
        slug_field="nombre_completo", queryset=Funcionarios.objects.all(), required=False)
    remitente = serializers.SlugRelatedField(
        slug_field="nombre_completo", queryset=Funcionarios.objects.all(), required=False)
    fecha = serializers.DateField(input_formats=["%Y-%m-%d", "iso-8601"])
    traslados = serializers.ReadOnlyField()
    solicitante = serializers.HiddenField(
        default=serializers.CurrentUserDefault())

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


class DeshechoSerializer(ModelSerializer):
    activos_plaqueados = serializers.PrimaryKeyRelatedField(
        queryset=Activos_Plaqueados.objects.all(), many=True, allow_null=True)
    activos_no_plaqueados = serializers.PrimaryKeyRelatedField(
        queryset=Activos_No_Plaqueados.objects.all(), many=True, allow_null=True)

    class Meta:
        model = Deshecho
        fields = "__all__"


class TipoSerializer(ModelSerializer):
    class Meta:
        model = Tipo
        fields = "__all__"


class SubtipoSerializer(ModelSerializer):
    class Meta:
        model = Subtipo
        fields = "__all__"


class CompraSerializer(ModelSerializer):

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        return {
            "id": instance.numero_orden_compra,
            **representation
        }

    class Meta:
        model = Compra
        fields = "__all__"


class UserSerializer(ModelSerializer):
    nombre = serializers.CharField(
        source="first_name", read_only=True)
    groups = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Group.objects.all())

    def validate_groups(self, value):

        if type(value) is str:
            return [value]
        elif type(value) is list:
            return value

        raise serializers.ValidationError(
            "El campo grupos debe de ser una lista")

    def to_internal_value(self, data):

        data['groups'] = self.validate_groups(data['groups'])
        return super().to_internal_value(data)

    class Meta:
        model = User
        exclude = ["password"]
        extra_kwards = {"groups": {"required": True}}


class RedSerializer(ModelSerializer):
    placa = serializers.StringRelatedField(
        source="activos_plaqueados_set.last.placa", default="")
    serie = serializers.StringRelatedField(
        source="activos_no_plaqueados_set.last.serie", default="")

    class Meta:
        model = Red
        fields = "__all__"


class ProveedorSerializer(ModelSerializer):
    class Meta:
        model = Proveedor
        fields = "__all__"


class UnidadSerializer(ModelSerializer):
    class Meta:
        model = Unidad
        fields = "__all__"


# REPORTES
class UbicacionReportSerializer(ModelSerializer):
    class Meta:
        model = Ubicaciones
        fields = "__all__"


class CompraReportSerializer(ModelSerializer):
    class Meta:
        model = Compra
        fields = "__all__"


class TramitesReportSerializer(ModelSerializer):
    class Meta:
        model = Tramites
        fields = ["tipo", "estado"]


class RedReportSerializer(ModelSerializer):
    class Meta:
        model = Red
        fields = "__all__"


class PlaqueadosReportSerializer(ModelSerializer):
    tramites = TramitesReportSerializer(many=True, read_only=True)
    ubicacion = UbicacionReportSerializer(read_only=True)
    ubicacion_anterior = UbicacionReportSerializer(read_only=True)
    tipo = serializers.StringRelatedField(read_only=True)
    subtipo = serializers.StringRelatedField(read_only=True)
    compra = CompraSerializer(read_only=True)
    red = RedReportSerializer(read_only=True)

    class Meta:
        model = Activos_Plaqueados
        fields = "__all__"
