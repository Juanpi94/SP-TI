from django.contrib import admin
from backend.models import Funcionarios, Tipo, Traslados, Ubicaciones

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


admin.site.register(Traslados, TrasladosAdmin)
admin.site.register(Ubicaciones, UbicacionesAdmin)
admin.site.register(Funcionarios, FuncionariosAdmin)
admin.site.register(Tipo, TiposAdmin)
