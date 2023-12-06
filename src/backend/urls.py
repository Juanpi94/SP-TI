from django.urls import path, include
from django.contrib.auth.decorators import login_required
from backend import views
from backend import api_views
from backend.routers import api_router


def protected(view): return login_required(view, "/login")


urlpatterns = [
    path("", views.index.as_view(), name="index"),
    path("plaqueados/", views.Activos_Plaqueados_View.as_view(), name="plaqueados"),
    path("no-plaqueados/", views.Activos_No_Plaqueados_View.as_view(),
         name="no_plaqueados"),
    path("tramites/", views.Tramites_View.as_view(), name="tramites"),
    path("generar/traslados", views.Generar_Tramite_View.as_view(),
         name="generar_traslados"),
    path("generar/taller", views.Taller_View.as_view(),
         name="generar_taller"),
    path("importar/reporte-plaqueados", views.Importar_Reporte_Plaqueados.as_view(),
         name="importar_reporte_plaqueados"),
    path("importar/reporte-no-plaqueados", views.Importar_Reporte_No_Plaqueados.as_view(),
         name="importar_reporte_no_plaqueados"),
    path("funcionarios/", views.Funcionarios_View.as_view(), name="funcionarios"),
    path("ubicaciones/", views.Ubicaciones_View.as_view(), name="ubicaciones"),
    path("perfil/", views.Perfil_View.as_view(), name="perfil"),
    path("tipo/", views.Tipo_View.as_view(), name="tipo"),
    path("subtipo/", views.Subtipo_View.as_view(), name="subtipo"),
    path("desecho/", views.Deshecho_View.as_view(), name="deshecho"),
    path("compra/", views.Compra_View.as_view(), name="compra"),
    path("users/", views.Users_View.as_view(), name="users"),
    path("red/", views.Red_Table_View.as_view(), name="red"),
    path("reportes/plaqueados", views.Reporte_Plaqueados.as_view(),
         name="reporte_plaqueados"),
    path("reportes/plaqueados/2-old", views.Reporte_Plaqueados_2_old.as_view(),
         name="reporte_plaqueados_2"),
    path("reportes/plaqueados/4-old", views.Reporte_Plaqueados_4_old.as_view(),
         name="reporte_plaqueados_4"),

    path("reportes/no-plaqueados", views.Reporte_No_Plaqueados.as_view(),
         name="reporte_no_plaqueados"),

    path("reportes/no-plaqueados/2-old", views.Reporte_No_Plaqueados_2_old.as_view(),
         name="reporte_no_plaqueados_2"),
    path("reportes/no-plaqueados/4-old", views.Reporte_No_Plaqueados_4_old.as_view(),
         name="reporte_no_plaqueados_4"),
    path("traslados", views.Traslados_Table_View.as_view(), name="traslados"),
    path("proveedores", views.Proveedores_Table_View.as_view(), name="proveedores"),
    path("unidades", views.Unidades_Table_View.as_view(), name="unidades"),
    path("", include("django.contrib.auth.urls")),



]

apiurlpatterns = [
    path('', include(api_router.urls)),
    path("importar/reporte-plaqueados", api_views.ImportarReportePlaqueados.as_view(),
         name="api-importar-reporte-plaqueados"),
    path("generar/tramite/traslado/", api_views.GenerarTramiteView.as_view(),
         name="generar-traslado"),

    path("exportar/", api_views.ExportarHojaDeCalculo.as_view()),
    path("auth/change_password/", api_views.ChangePasswordView.as_view())
]

urlpatterns.extend([
    path('api/', include(apiurlpatterns))
])
