from django.contrib import admin
from backend.models import Funcionarios, Tipo, Traslados, Ubicaciones, Unidad, Proveedor, Red, Compra, Taller, Deshecho, Tramites, Permissions, Activos, Subtipo
admin.site.site_title = "ATIC Admin"

admin.site.site_header = "Administración de ATIC"

# Register your models here.


class UbicacionesAdmin(admin.ModelAdmin):
    pass


class FuncionariosAdmin(admin.ModelAdmin):
    search_fields = ['nombre_completo', 'cedula']


class TiposAdmin(admin.ModelAdmin):
    pass


class TrasladosAdmin(admin.ModelAdmin):
    pass


class UnidadesAdmin(admin.ModelAdmin):
    pass


class ProveedoresAdmin(admin.ModelAdmin):
    pass


class RedAdmin(admin.ModelAdmin):
    pass


class CompraAdmin(admin.ModelAdmin):
    pass


class TallerAdmin(admin.ModelAdmin):
    pass


class DeshechoAdmin(admin.ModelAdmin):
    pass


class PermissionAdmin(admin.ModelAdmin):
    pass


class TramitesAdmin(admin.ModelAdmin):
    pass


class ActivosAdmin(admin.ModelAdmin):
    pass


class SubtiposAdmin(admin.ModelAdmin):
    pass


admin.site.register(Traslados, TrasladosAdmin)
admin.site.register(Ubicaciones, UbicacionesAdmin)
admin.site.register(Funcionarios, FuncionariosAdmin)
admin.site.register(Tipo, TiposAdmin)
admin.site.register(Unidad, UnidadesAdmin)
admin.site.register(Proveedor, ProveedoresAdmin)
admin.site.register(Red, RedAdmin)
admin.site.register(Compra, CompraAdmin)
admin.site.register(Taller, TallerAdmin)
admin.site.register(Deshecho, DeshechoAdmin)
admin.site.register(Tramites, TramitesAdmin)
admin.site.register(Permissions, PermissionAdmin)
admin.site.register(Activos, ActivosAdmin)
admin.site.register(Subtipo, SubtiposAdmin)
