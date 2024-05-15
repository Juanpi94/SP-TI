from .models import *
from django.contrib.auth.models import Group, User
from rest_framework import serializers

class RelatedFields(serializers.RelatedField):
    def to_representation(self, value):
        return value.name

class PlaqueadosSerializer(serializers.ModelSerializer):
    compra = serializers.SlugRelatedField(slug_field="numero_orden_compra", queryset=Compra.objects.all())
    red = serializers.SlugRelatedField(slug_field="is", queryset=Red.objects.all())
    subtipo = serializers.SlugRelatedField(slug_field="id", queryset=Subtipo.objects.all())
    tipo = serializers.SlugRelatedField(slug_field="id", queryset=Tipo.objects.all())
    ubicacion = serializers.SlugRelatedField(slug_field="id", queryset=Ubicaciones.objects.all())
    ubicacion_anterior = serializers.SlugRelatedField(slug_field="id", queryset=Ubicaciones.objects.all())
    estado = serializers.SlugRelatedField(slug_field="id", queryset=Estados.objects.all())

    class Meta:
        model = Activos_Plaqueados
        fields = "__all__"

class NoPlaqueadosSerializer(serializers.ModelSerializer):
    compra = serializers.SlugRelatedField(slug_field="numero_factura", queryset=Compra.objects.all())
    estado = serializers.SlugRelatedField(slug_field="id", queryset=Estados.objects.all())
    red = serializers.SlugRelatedField(slug_field="MAC", queryset=Red.objects.all())
    subtipo = serializers.SlugRelatedField(slug_field="nombre", queryset=Subtipo.objects.all())
    tipo = serializers.SlugRelatedField(slug_field="nombre", queryset=Tipo.objects.all())
    ubicacion = serializers.SlugRelatedField(slug_field="ubicacion", queryset=Ubicaciones.objects.all())
    ubicacion_anterior = serializers.SlugRelatedField(slug_field="ubicacion", queryset=Ubicaciones.objects.all())

    class Meta:
        model = Activos_No_Plaqueados
        fields = "__all__"



class CompraSerializer(serializers.ModelSerializer):
    proveedor = serializers.SlugRelatedField(slug_field="id", queryset=Proveedor.objects.all())
    
    # def to_representation(self, instance):
    #     representation = super().to_representation(instance)

    #     return {
    #         "id": instance.numero_orden_compra,
    #         **representation
    #     }

    class Meta:
        model = Compra
        fields = "__all__"

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

# REPORTES
class UbicacionReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ubicaciones
        fields = "__all__"

class TramitesReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tramites
        fields = ["tipo", "estado"]

class RedReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Red
        fields = "__all__"

class PlaqueadosReportSerializer(serializers.ModelSerializer):
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


#-------------# Area de Pruebas #-------------#

class PruebasAPISerializer(serializers.ModelSerializer):
    class Meta:
        model = PruebasAPI
        fields = '__all__'
        
class RelPruebasAPISerializer(serializers.ModelSerializer):
    class Meta:
        model = RelPruebasAPI
        fields = '__all__'

#-----------# Fin Area de Pruebas #-----------#


#-----------# serializers funcionando #-----------#

class TallerSerializer(serializers.ModelSerializer):
    tramite = serializers.SlugRelatedField(slug_field="id", queryset=Tramites.objects.all())

    class Meta:
        model = Taller
        fields = "__all__"

class RedSerializer(serializers.ModelSerializer):
    placa = serializers.StringRelatedField(source="activos_plaqueados_set.last.placa", default="")
    serie = serializers.StringRelatedField(source="activos_no_plaqueados_set.last.serie", default="")

    class Meta:
        model = Red
        fields = "__all__"

class TipoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tipo
        fields = "__all__"

class CompraReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Compra
        fields = "__all__"

class SubtipoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtipo
        fields = "__all__"

class TramitesSerializer(serializers.ModelSerializer):
    solicitante = serializers.SlugRelatedField(slug_field="id", queryset=User.objects.all())
    recipiente = serializers.SlugRelatedField(slug_field="id", queryset=Funcionarios.objects.all())
    remitente = serializers.SlugRelatedField(slug_field="id", queryset=Funcionarios.objects.all())
    tipo = serializers.SlugRelatedField(slug_field="id", queryset=TiposTramites.objects.all())
    estado = serializers.SlugRelatedField(slug_field="id", queryset=TiposEstados.objects.all())
    fecha = serializers.DateField(format="%Y-%m-%d", input_formats=["%Y-%m-%d", "iso-8601"])

    class Meta:
        model = Tramites
        fields = "__all__"

class UnidadSerializer(serializers.ModelSerializer):
    coordinador = serializers.SlugRelatedField(slug_field="id", queryset=Funcionarios.objects.all())
    
    field_to_edit = serializers.CharField()
    
    class Meta:
        model = Unidad
        fields = '__all__'

class UbicacionesSerializer(serializers.ModelSerializer):
    custodio = serializers.SlugRelatedField(slug_field="id", queryset=Funcionarios.objects.all())
    unidad = serializers.SlugRelatedField(slug_field="codigo", queryset=Unidad.objects.all())
    instalacion = serializers.SlugRelatedField(slug_field="id", queryset=Instalaciones.objects.all())
    
    class Meta:
        model = Ubicaciones
        fields = "__all__"

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = "__all__"

class FuncionariosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionarios
        fields = "__all__"

class TrasladosSerializer(serializers.ModelSerializer):
    destino = serializers.SlugRelatedField(slug_field="id", queryset=Ubicaciones.objects.all())
    tramite = serializers.SlugRelatedField(slug_field="id", queryset=Tramites.objects.all())
    
    class Meta:
        model = Traslados
        fields = '__all__'

class DeshechoSerializer(serializers.ModelSerializer):
    tramite = serializers.SlugRelatedField(slug_field="id", queryset=Tramites.objects.all())

    class Meta:
        model = Deshecho
        fields = "__all__"


#-----------# serializers funcionando #-----------#