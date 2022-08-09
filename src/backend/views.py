from calendar import c
from itertools import count
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.views.generic import TemplateView, RedirectView
from backend import models
from backend.exceptions import ArgMissingException
from backend.forms import FuncionariosForm, NoPlaqueadosForm, PlaqueadosForm, TramitesExportForm, TramitesForm, UbicacionesForm


class PermissionsMixin(LoginRequiredMixin, PermissionRequiredMixin):
    login_url = "/login"
    permission_required = "backend.escritura"


class index(RedirectView):
    pattern_name = "plaqueados"


class Table_View(PermissionsMixin, TemplateView):

    """
    Clase utilizada para reciclar logica de tablas
    ...
    Attributes
    ----------
    target_view : str
        La vista API donde se dirigen las solicitudes
    columns : str | str[]
        Las columnas que llevara la tabla, siempre se omite el id
        utilizar __all__ imprimira todos los campos (menos el id)
    exclude : str[], optional
        Las columnas que serán excluidas
    model : model
        El modelo en el que se basa la tabla
    form: form
        El formulario que se utiliza para las ediciones y creaciones
    add: bool, optional
        Determina si habrá o no un formulario para crear registros (default=True)
    """

    template_name = "dinamic/table.html"
    add = True
    exclude = []

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['target_view'] = reverse(self.target_view)
        self.check_args()
        if (self.columns == "__all__" and self.model):

            self.columns = [
                field.name for field in self.model._meta.get_fields()]
            if(len(self.exclude)):
                self.columns = [
                    field for field in self.columns if field not in self.exclude]
        context['columns'] = self.columns
        context['form'] = self.form()
        context['add'] = self.add
        return context

    def check_args(self):
        keys = dir(self)
        non_optional_args = ["columns", "model", "form", "target_view"]
        missing_args = [arg for arg in non_optional_args if arg not in keys]

        if (len(missing_args)):
            raise ArgMissingException(*missing_args)


class Activos_Plaqueados_View(Table_View):

    target_view = "plaqueados-list"
    columns = "__all__"
    exclude = ["id"]
    model = models.Activos_Plaqueados
    form = PlaqueadosForm


class Tramites_View(Table_View):
    target_view = "tramites-list"
    columns = "__all__"
    exclude = ["id", "activos", "activos_sin_placa"]
    model = models.Tramites
    form = TramitesForm
    add = False


class Activos_No_Plaqueados_View(Table_View):
    target_view = "no_plaqueados-list"
    columns = "__all__"
    exclude = ["id"]
    model = models.Activos_No_Plaqueados
    form = NoPlaqueadosForm


class Funcionarios_View(Table_View):
    target_view = "funcionarios-list"
    columns = "__all__"
    exclude = ["id", "ubicaciones"]
    model = models.Funcionarios
    form = FuncionariosForm


class Ubicaciones_View(Table_View):
    target_view = "ubicaciones-list"
    columns = "__all__"
    exclude = ["id", "activos_plaqueados", "activos_no_plaqueados"]
    model = models.Ubicaciones
    form = UbicacionesForm


class Generar_Tramite_View(PermissionsMixin, TemplateView):
    template_name = "generar/traslados.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = TramitesExportForm()
        return context


class Importar_Activos_View(PermissionsMixin, TemplateView):
    template_name = "importar/activos.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        queryparams = self.request.GET
        message = queryparams.get("message")
        error = queryparams.get("error")

        if(error):
            error = True if error == "True" else False

        context['message'] = message
        context['error'] = error
        return context
