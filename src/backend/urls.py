from email.mime import base
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.contrib.auth.decorators import login_required
from backend import views
from backend import api_views
from backend.api_views import PlaqueadosApiViewset, TramitesApiViewset, TrasladosApiViewset


def protected(view): return login_required(view, "/login")


urlpatterns = [
    path("", views.index.as_view(), name="index"),
    path("plaqueados/", views.Activos_Plaqueados_View.as_view(), name="plaqueados"),
    path("tramites/", views.Tramites_View.as_view(), name="tramites"),
    path("generar/traslados", views.Generar_Tramite_View.as_view(),
         name="generar-traslados"),
    path("importar/activos", views.Importar_Activos_View.as_view(),
         name="importar-activos"),
    path("", include("django.contrib.auth.urls"))
]


# api urls
router = DefaultRouter()

router.register(r"plaqueados", PlaqueadosApiViewset, basename="plaqueados")
router.register(r"tramites", TramitesApiViewset, basename="tramites")
router.register(r"traslados", TrasladosApiViewset, basename="traslados")

apiurlpatterns = [
    path('', include(router.urls)),
    path("importar/activos", api_views.ImportarActivosApiView.as_view(),
         name="api-importar-activos")
]

urlpatterns.extend([
    path('api/', include(apiurlpatterns))
])
