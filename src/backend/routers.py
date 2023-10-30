from rest_framework.routers import DefaultRouter
from backend.api_views import *

api_router = DefaultRouter()

api_router.register(r"plaqueados", PlaqueadosApiViewset, basename="plaqueados")
api_router.register(r"tramites", TramitesApiViewset, basename="tramites")
api_router.register(r"traslados", TrasladosApiViewset, basename="traslados")
api_router.register(r"no_plaqueados", NoPlaqueadosApiViewSet,
                    basename="no_plaqueados")

api_router.register(r"funcionarios", FuncionariosApiViewset,
                    basename="funcionarios")
api_router.register(r"ubicaciones", UbicacionesApiViewset, "ubicaciones")

api_router.register(r"tipo", TipoApiViewset, "tipo")
api_router.register(r"subtipos", SubtipoApiViewSet, "subtipo")
api_router.register(r"deshecho", DeshechoApiViewset, "deshecho")

api_router.register(r"compra", CompraApiViewset, "compra")

api_router.register(r"user", UserApiViewset, "user")

api_router.register(r"taller", TallerApiViewset, "taller")
api_router.register(r"red", RedApiViewset, "red")
api_router.register(r"proveedor", ProveedorApiViewset, "proveedor")
api_router.register(r"unidades", UnidadApiViewset, "unidades")
