from django.urls import path, include
from django.contrib.auth.decorators import login_required
from backend import views
from backend import api_views
from backend.routers import api_router


def protected(view): return login_required(view, "/login")

urlpatterns = [
    path("", views.index.as_view(), name="index"),
    path("", include("django.contrib.auth.urls")),
    path("perfil/", views.Perfil_View.as_view(), name="perfil"),
    
    # PLATAFORMA
    ## Activos
    path("tipo/", views.Tipo_View.as_view(), name="tipo"),
    path("red/", views.Red_Table_View.as_view(), name="red"),
    path("compra/", views.Compra_View.as_view(), name="compra"),
    path("subtipos/", views.Subtipo_View.as_view(), name="subtipos"),
    path("activos_plaqueados/", views.Activos_Plaqueados_View.as_view(), name="activos_plaqueados"),
    path("activos_no_plaqueados/", views.Activos_No_Plaqueados_View.as_view(), name="activos_no_plaqueados"),
    
    ## Tramites
    path("tramites/", views.Tramites_View.as_view(), name="tramites"),
    path("traslados/", views.Traslados_Table_View.as_view(), name="traslados"),
    path("generar/taller/", views.Taller_View.as_view(), name="generar_taller"),
    path("generar/desecho/", views.Desecho_View.as_view(), name="generar_desecho"),
    path("generar/traslados/", views.Generar_Traslado_View.as_view(), name="generar_traslados"),
    
    ## Reportes
    path("reportes/plaqueados/", views.Reporte_Plaqueados.as_view(), name="reporte_plaqueados"),
    path("reportes/no-plaqueados/", views.Reporte_No_Plaqueados.as_view(), name="reporte_no_plaqueados"),
    path("reportes/plaqueados/2-old/", views.Reporte_Plaqueados_2_old.as_view(), name="reporte_plaqueados_2"),
    path("reportes/plaqueados/4-old/", views.Reporte_Plaqueados_4_old.as_view(), name="reporte_plaqueados_4"),
    path("reportes/no-plaqueados/2-old/", views.Reporte_No_Plaqueados_2_old.as_view(), name="reporte_no_plaqueados_2"),
    path("reportes/no-plaqueados/4-old/", views.Reporte_No_Plaqueados_4_old.as_view(), name="reporte_no_plaqueados_4"),
    
    # ADMINISTRACION
    ## Gestion
    path("user/", views.User_View.as_view(), name="user"),
    path("unidades/", views.Unidades_Table_View.as_view(), name="unidades"),
    path("ubicaciones/", views.Ubicaciones_View.as_view(), name="ubicaciones"),
    path("funcionarios/", views.Funcionarios_View.as_view(), name="funcionarios"),
    path("proveedor/", views.Proveedores_Table_View.as_view(), name="proveedor"),
    
    # Importar
    path("importar/reporte-plaqueados/", views.Importar_Reporte_Plaqueados.as_view(), name="importar_reporte_plaqueados"),
    path("importar/reporte-no-plaqueados/", views.Importar_Reporte_No_Plaqueados.as_view(), name="importar_reporte_no_plaqueados"),
    
    #-------------# Area de Pruebas #-------------#   
    
    # path('editData/<int:codigo>/', views.EditUnidadView.as_view(), name='editData'),
    path('<str:model_name>/<int:primary_key>/edit/', views.EditGenericView.as_view(), name='editData'),
    
    #-----------# Fin Area de Pruebas #-----------#

]

apiurlpatterns = [
    path('', include(api_router.urls)),
    path("generar/tramite/traslado/", api_views.GenerarTramiteView.as_view(), name="generar-traslado"),
    path("importar/reporte-plaqueados", api_views.ImportarReportePlaqueados.as_view(), name="api-importar-reporte-plaqueados"),
    path("importar/reporte-no-plaqueados", api_views.ImportarReporteNoPlaqueados.as_view(), name="api-importar-reporte-no-plaqueados"),
    path("exportar/", api_views.ExportarHojaDeCalculo.as_view()),
    path("auth/change_password/", api_views.ChangePasswordView.as_view()),
    
    
#-------------# Area de Pruebas #-------------#   



#-----------# Fin Area de Pruebas #-----------#

]

urlpatterns.extend([
    path('api/', include(apiurlpatterns))
])