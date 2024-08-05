from django.contrib import admin
from backend.models import *

admin.site.site_title = "ATIC Admin"

admin.site.site_header = "Administración de ATIC"


# Register your models here.


class UbicacionesAdmin(admin.ModelAdmin):
    pass


class FuncionariosAdmin(admin.ModelAdmin):
    search_fields = ['nombre_completo', 'cedula']


class TiposAdmin(admin.ModelAdmin):
    pass

class EstadosAdmin(admin.ModelAdmin):
    pass


class TrasladosAdmin(admin.ModelAdmin):
    pass


class CoordinacionesAdmin(admin.ModelAdmin):
    pass


class ProveedoresAdmin(admin.ModelAdmin):
    pass


class RedAdmin(admin.ModelAdmin):
    pass


class CompraAdmin(admin.ModelAdmin):
    pass


class TallerAdmin(admin.ModelAdmin):
    pass


class DesechoAdmin(admin.ModelAdmin):
    pass


class PermissionAdmin(admin.ModelAdmin):
    pass


class TramitesAdmin(admin.ModelAdmin):
    pass


class ActivosPlaqueadosAdmin(admin.ModelAdmin):
    pass


class ActivosNoPlaqueadosAdmin(admin.ModelAdmin):
    pass


class SubtiposAdmin(admin.ModelAdmin):
    pass

class TiposTramitesAdmin(admin.ModelAdmin):
    pass

class TiposEstadosAdmin(admin.ModelAdmin):
    pass

class InstalacionesAdmin(admin.ModelAdmin):
    pass

class CategoriaAdmin(admin.ModelAdmin):
    pass

class PartidasAdmin(admin.ModelAdmin):
    pass

class EstadosAdmin(admin.ModelAdmin):
    pass

class ModelosAdmin(admin.ModelAdmin):
    pass

class MarcasAdmin(admin.ModelAdmin):
    pass

admin.site.register(Red, RedAdmin)
admin.site.register(Tipo, TiposAdmin)
admin.site.register(Compra, CompraAdmin)
admin.site.register(Taller, TallerAdmin)
admin.site.register(Marcas, MarcasAdmin)
admin.site.register(Estados, EstadosAdmin)
admin.site.register(Desecho, DesechoAdmin)
admin.site.register(Modelos, ModelosAdmin)
admin.site.register(Partida, PartidasAdmin)
admin.site.register(Subtipo, SubtiposAdmin)
admin.site.register(Tramites, TramitesAdmin)
admin.site.register(Categoria, CategoriaAdmin)
admin.site.register(Proveedor, ProveedoresAdmin)
admin.site.register(Permissions, PermissionAdmin)
admin.site.register(Ubicaciones, UbicacionesAdmin)
admin.site.register(TiposEstados, TiposEstadosAdmin)
admin.site.register(Funcionarios, FuncionariosAdmin)
admin.site.register(TiposTramites, TiposTramitesAdmin)
admin.site.register(Instalaciones, InstalacionesAdmin)
admin.site.register(Coordinaciones, CoordinacionesAdmin)
admin.site.register(Activos_Plaqueados, ActivosPlaqueadosAdmin)
admin.site.register(Activos_No_Plaqueados, ActivosNoPlaqueadosAdmin)

#-------------# Area de Pruebas #-------------#



#-----------# Fin Area de Pruebas #-----------#