from email.mime import base
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.contrib.auth.decorators import login_required
from backend import views
from backend import api_views
from backend.api_views import CompraApiViewset, DeshechoApiViewset, FuncionariosApiViewset, NoPlaqueadosApiViewSet, PlaqueadosApiViewset, ProveedorApiViewset, RedApiViewset, SubtipoApiViewSet, TallerApiViewset, TipoApiViewset, TramitesApiViewset, TrasladosApiViewset, UbicacionesApiViewset, UnidadApiViewset, UserApiViewset


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
    path("importar/activos", views.Importar_Activos_View.as_view(),
         name="importar_activos"),
    path("importar/no-plaqueados", views.Importar_Activos_No_Plaqueados_View.as_view(),
         name="importar_no_plaqueados"),
    path("importar/reporte-plaqueados", views.Importar_Reporte_Plaqueados.as_view(),
         name="importar_reporte_plaqueados"),
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


# api urls
router = DefaultRouter()


router.register(r"plaqueados", PlaqueadosApiViewset, basename="plaqueados")
router.register(r"tramites", TramitesApiViewset, basename="tramites")
router.register(r"traslados", TrasladosApiViewset, basename="traslados")
router.register(r"no_plaqueados", NoPlaqueadosApiViewSet,
                basename="no_plaqueados")

router.register(r"funcionarios", FuncionariosApiViewset,
                basename="funcionarios")
router.register(r"ubicaciones", UbicacionesApiViewset, "ubicaciones")

router.register(r"tipo", TipoApiViewset, "tipo")
router.register(r"subtipos", SubtipoApiViewSet, "subtipo")
router.register(r"deshecho", DeshechoApiViewset, "deshecho")

router.register(r"compra", CompraApiViewset, "compra")

router.register(r"user", UserApiViewset, "user")

router.register(r"taller", TallerApiViewset, "taller")
router.register(r"red", RedApiViewset, "red")
router.register(r"proveedor", ProveedorApiViewset, "proveedor")
router.register(r"unidades", UnidadApiViewset, "unidades")
apiurlpatterns = [
    path('', include(router.urls)),
    path("importar/activos", api_views.ImportarActivosApiView.as_view(),
         name="api-importar-activos"),
    path("importar/no-plaqueados", api_views.ImportarActivosNoPlaqueadosApiView.as_view(),
         name="api-importar-no-plaqueados"),
    path("importar/reporte-plaqueados", api_views.ImportarReportePlaqueados.as_view(),
         name="api-importar-reporte-plaqueados"),
    path("exportar/", api_views.ExportarHojaDeCalculo.as_view()),
    path("auth/change_password/", api_views.ChangePasswordView.as_view())
]

urlpatterns.extend([
    path('api/', include(apiurlpatterns))
])
