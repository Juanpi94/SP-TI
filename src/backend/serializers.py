from .models import *
from django.contrib.auth.models import Group, User
from rest_framework import serializers

    
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

#-------------# Area de Pruebas #-------------#



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

    class Meta:
        model = Tramites
        fields = "__all__"

class UnidadesSerializer(serializers.ModelSerializer):
    coordinador = serializers.SlugRelatedField(slug_field="id", queryset=Funcionarios.objects.all())
    
    class Meta:
        model = Unidades
        fields = '__all__'

class UbicacionesSerializer(serializers.ModelSerializer):
    custodio = serializers.SlugRelatedField(slug_field="id", queryset=Funcionarios.objects.all())
    unidades = serializers.SlugRelatedField(slug_field="codigo", queryset=Unidades.objects.all())
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


class DesechoSerializer(serializers.ModelSerializer):
    tramite = serializers.SlugRelatedField(slug_field="id", queryset=Tramites.objects.all())

    class Meta:
        model = Desecho
        fields = "__all__"

class CompraSerializer(serializers.ModelSerializer):
    proveedor = serializers.SlugRelatedField(slug_field="id", queryset=Proveedor.objects.all())
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)

        return {
            "id": instance.numero_orden_compra,
            **representation
        }

    class Meta:
        model = Compra
        fields = "__all__"
  
class PlaqueadosSerializer(serializers.ModelSerializer):
    tipo = serializers.SlugRelatedField(slug_field="id", queryset=Tipo.objects.all())
    subtipo = serializers.SlugRelatedField(slug_field="id", queryset=Subtipo.objects.all())
    compra = serializers.SlugRelatedField(slug_field="numero_orden_compra", queryset=Compra.objects.all())
    red = serializers.SlugRelatedField(slug_field="id", queryset=Red.objects.all())
    ubicacion = serializers.SlugRelatedField(slug_field="id", queryset=Ubicaciones.objects.all())
    estado = serializers.SlugRelatedField(slug_field="id", queryset=Estados.objects.all())
    ubicacion_anterior = serializers.SlugRelatedField(slug_field="id", queryset=Ubicaciones.objects.all())
    tramites = serializers.SlugRelatedField(slug_field="id", queryset=Tramites.objects.all(), many=True)
    
    class Meta:
        model = Activos_Plaqueados
        fields = "__all__"
 
class NoPlaqueadosSerializer(serializers.ModelSerializer):
    tipo = serializers.SlugRelatedField(slug_field="id", queryset=Tipo.objects.all())
    subtipo = serializers.SlugRelatedField(slug_field="id", queryset=Subtipo.objects.all())
    compra = serializers.SlugRelatedField(slug_field="numero_orden_compra", queryset=Compra.objects.all())
    red = serializers.SlugRelatedField(slug_field="id", queryset=Red.objects.all())
    ubicacion = serializers.SlugRelatedField(slug_field="id", queryset=Ubicaciones.objects.all())
    estado = serializers.SlugRelatedField(slug_field="id", queryset=Estados.objects.all())
    ubicacion_anterior = serializers.SlugRelatedField(slug_field="id", queryset=Ubicaciones.objects.all())
    tramites = serializers.SlugRelatedField(slug_field="id", queryset=Tramites.objects.all(), many=True)

    class Meta:
        model = Activos_No_Plaqueados
        fields = "__all__"
 
class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(
        many=True,
        slug_field='id',
        queryset=Group.objects.all()
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'groups', 'password', 'first_name', 'last_name', 'is_superuser',
                  'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions']
        

#-----------# serializers funcionando #-----------#

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

