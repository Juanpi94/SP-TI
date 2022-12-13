from email.mime import base
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.contrib.auth.decorators import login_required
from backend import views
from backend import api_views
from backend.api_views import DeshechoApiViewset, FuncionariosApiViewset, NoPlaqueadosApiViewSet, PlaqueadosApiViewset, SubtipoApiViewSet, TipoApiViewset, TramitesApiViewset, TrasladosApiViewset, UbicacionesApiViewset


def protected(view): return login_required(view, "/login")


urlpatterns = [
    path("", views.index.as_view(), name="index"),
    path("plaqueados/", views.Activos_Plaqueados_View.as_view(), name="plaqueados"),
    path("no_plaqueados/", views.Activos_No_Plaqueados_View.as_view(),
         name="no_plaqueados"),
    path("tramites/", views.Tramites_View.as_view(), name="tramites"),
    path("generar/traslados", views.Generar_Tramite_View.as_view(),
         name="generar-traslados"),
    path("importar/activos", views.Importar_Activos_View.as_view(),
         name="importar-activos"),
    path("importar/no_plaqueados", views.Importar_Activos_No_Plaqueados_View.as_view(),
         name="importar-no-plaqueados"),
    path("funcionarios/", views.Funcionarios_View.as_view(), name="funcionarios"),
    path("ubicaciones/", views.Ubicaciones_View.as_view(), name="ubicaciones"),
    path("perfil/", views.Perfil_View.as_view(), name="perfil"),
    path("tipo/", views.Tipo_View.as_view(), name="tipo"),
    path("subtipo/", views.Subtipo_View.as_view(), name="subtipo"),
    path("desecho/", views.Deshecho_View.as_view(), name="deshecho"),
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
apiurlpatterns = [
    path('', include(router.urls)),
    path("importar/activos", api_views.ImportarActivosApiView.as_view(),
         name="api-importar-activos"),
    path("importar/no_plaqueados", api_views.ImportarActivosNoPlaqueadosApiView.as_view(),
         name="api-importar-no-plaqueados"),
    path("exportar/", api_views.ExportarHojaDeCalculo.as_view()),
    path("auth/change_password/", api_views.ChangePasswordView.as_view())
]

urlpatterns.extend([
    path('api/', include(apiurlpatterns))
])
