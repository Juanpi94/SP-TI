from email.mime import base
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.contrib.auth.decorators import login_required
from backend import views
from backend import api_views
from backend.api_views import FuncionariosApiViewset, NoPlaqueadosApiViewSet, PlaqueadosApiViewset, TramitesApiViewset, TrasladosApiViewset, UbicacionesApiViewset


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
     path("importar/no_plaqueados", views.Importar_Activos_No_Plaqueados_View.as_view(), name="importar-no-plaqueados"),
    path("funcionarios/", views.Funcionarios_View.as_view(), name="funcionarios"),
    path("ubicaciones/", views.Ubicaciones_View.as_view(), name="ubicaciones"),
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
apiurlpatterns = [
    path('', include(router.urls)),
    path("importar/activos", api_views.ImportarActivosApiView.as_view(),
         name="api-importar-activos"),
     path("importar/no_plaqueados", api_views.ImportarActivosNoPlaqueadosApiView.as_view(), name="api-importar-no-plaqueados"),
    path("exportar/", api_views.ExportarHojaDeCalculo.as_view())
]

urlpatterns.extend([
    path('api/', include(apiurlpatterns))
])
