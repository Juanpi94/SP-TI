from calendar import c
from datetime import datetime

from itertools import count
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.views.generic import TemplateView, RedirectView
from backend import models
from backend.exceptions import ArgMissingException
from backend.forms import CompraForm, DeshechoExportForm, FuncionariosForm, NoPlaqueadosForm, PlaqueadosForm, RedForm, TallerExportForm, TipoForm, TramitesExportForm, TramitesForm, UbicacionesForm, SubtipoForm, UserForm


class Table():
    headers = []
    body = {}


class ReadPermMixin(LoginRequiredMixin, PermissionRequiredMixin):
    login_url = "/login"
    permission_required = "backend.lectura"


class WritePermMixin(LoginRequiredMixin, PermissionRequiredMixin):
    login_url = "/login"
    permission_required = "backend.escritura"


class index(RedirectView):
    pattern_name = "plaqueados"


class Table_View(ReadPermMixin, TemplateView):

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
    edit: bool, optional
        Determina se podrá editar un registro(default=True)
    title : str
        Titulo de la tabla
    """

    template_name = "dinamic/table.html"
    add = True
    edit = True
    exclude = []
    title = ""

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
        context["edit"] = self.edit
        context["title"] = self.title
        return context

    def check_args(self):
        keys = dir(self)
        non_optional_args = ["columns", "model", "form", "target_view"]
        missing_args = [arg for arg in non_optional_args if arg not in keys]

        if (len(missing_args)):
            raise ArgMissingException(*missing_args)


class Activos_Plaqueados_View(Table_View):

    target_view = "plaqueados-list"
    columns = ["placa", "nombre", "marca", "modelo",
               "serie", "valor", "garantia", "observacion", "compra"]
    exclude = ["id", "deshecho"]
    model = models.Activos_Plaqueados
    form = PlaqueadosForm
    title = "Activos plaqueados"


class Tramites_View(Table_View):
    target_view = "tramites-list"
    columns = ["referencia", "activos_plaqueados", "activos_no_plaqueados",
               "solicitante", "tipo", "detalles", "fecha", "estado"]
    exclude = ["id", "activos",
               "traslados", "deshecho"]
    model = models.Tramites
    form = TramitesForm
    add = False
    title = "Tramites"


class Activos_No_Plaqueados_View(Table_View):
    target_view = "no_plaqueados-list"
    columns = ["serie", "nombre", "marca",
               "modelo", "valor", "garantia", "observacion"]
    exclude = ["id", "deshecho", "fecha_ingreso", "tramites"]
    model = models.Activos_No_Plaqueados
    form = NoPlaqueadosForm
    title = "Activos no plaqueados"


class Funcionarios_View(Table_View):
    target_view = "funcionarios-list"
    columns = "__all__"
    exclude = ["id", "ubicaciones"]
    model = models.Funcionarios
    form = FuncionariosForm
    title = "Funcionarios"


class Ubicaciones_View(Table_View):
    target_view = "ubicaciones-list"
    columns = "__all__"
    exclude = ["id", "activos_plaqueados",
               "activos_no_plaqueados", "plaqueados", "no_plaqueados"]
    model = models.Ubicaciones
    form = UbicacionesForm
    title = "Ubicaciones"


class Generar_Tramite_View(WritePermMixin, TemplateView):
    template_name = "generar/traslados.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = TramitesExportForm()
        return context


class ImportTemplateView(TemplateView):
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


class Importar_Activos_View(WritePermMixin, ImportTemplateView):
    template_name = "importar/activos.html"


class Importar_Activos_No_Plaqueados_View(WritePermMixin, ImportTemplateView):
    template_name = "importar/noPlaqueados.html"


class Importar_Reporte_Plaqueados(WritePermMixin, ImportTemplateView):
    template_name = "importar/reportePlaqueados.html"


class Perfil_View(LoginRequiredMixin, TemplateView):
    template_name = "auth/perfil.html"


class Tipo_View(Table_View):
    target_view = "tipo-list"
    columns = ["nombre", "detalle"]
    exclude = ["id", "activos_plaqueados", "activos_no_plaqueados"]
    model = models.Tipo
    form = TipoForm
    title = "Tipos de activos"


class Subtipo_View(Table_View):
    target_view = "subtipo-list"
    columns = "__all__"
    exclude = ["id", "activos_plaqueados", "activos_no_plaqueados"]
    model = models.Subtipo
    form = SubtipoForm
    title = "Subtipos de activos"


class Compra_View(Table_View):
    target_view = "compra-list"
    columns = "__all__"
    exclude = ["id", "activos_plaqueados", "activos_no_plaqueados"]
    model = models.Compra
    form = CompraForm
    title = "Compras"


class Users_View(Table_View):
    target_view = "user-list"
    columns = ["nombre", "username"]
    exclude = ["id", "password"]
    model = models.User
    form = UserForm
    title = "Usuarios"


class Deshecho_View (WritePermMixin, TemplateView):
    template_name = "generar/deshecho.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = DeshechoExportForm()
        return context


class Taller_View (WritePermMixin, TemplateView):
    template_name = "generar/taller.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = TallerExportForm()
        return context


class Reporte_Plaqueados(ReadPermMixin, TemplateView):
    template_name = "reportes/reportePlaqueados.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        data = models.Activos_Plaqueados.objects.prefetch_related().all()
        context["rows"] = data
        context["title"] = "Reporte de activos plaqueados"
        return context


class Reporte_No_Plaqueados(ReadPermMixin, TemplateView):
    template_name = "reportes/reporteNoPlaqueados.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        data = models.Activos_No_Plaqueados.objects.prefetch_related().all()
        context["rows"] = data
        context["title"] = "Reporte de activos no plaqueados"

        return context


class Reporte_No_Plaqueados_2_old(Reporte_No_Plaqueados):

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        two_years_ago = datetime.now()
        if(two_years_ago.day == 29 and two_years_ago.month == 2):
            two_years_ago = two_years_ago.replace(day=28)
        two_years_ago = two_years_ago.replace(year=two_years_ago.year - 2)

        data = models.Activos_No_Plaqueados.objects.prefetch_related().filter(
            fecha_ingreso__lte=two_years_ago)
        context["rows"] = data
        context["title"] = "Reporte de activos no plaqueados con 2 años de antigüedad"

        return context


class Reporte_No_Plaqueados_4_old(Reporte_No_Plaqueados):

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        four_years_ago = datetime.now()
        if(four_years_ago.day == 29 and four_years_ago.month == 2):
            four_years_ago = four_years_ago.replace(day=28)
        four_years_ago = four_years_ago.replace(year=four_years_ago.year - 4)

        data = models.Activos_No_Plaqueados.objects.prefetch_related().filter(
            fecha_ingreso__lte=four_years_ago)
        context["rows"] = data
        context["title"] = "Reporte de activos no plaqueados con 4 años de antigüedad"
        return context


class Reporte_Plaqueados_2_old(Reporte_Plaqueados):

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        two_years_ago = datetime.now()
        if(two_years_ago.day == 29 and two_years_ago.month == 2):
            two_years_ago = two_years_ago.replace(day=28)
        two_years_ago = two_years_ago.replace(year=two_years_ago.year - 2)

        data = models.Activos_Plaqueados.objects.prefetch_related().filter(
            fecha_ingreso__lte=two_years_ago)
        context["rows"] = data
        context["title"] = "Reporte de activos plaqueados con 2 años de antigüedad"
        return context


class Reporte_Plaqueados_4_old(Reporte_Plaqueados):

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        four_years_ago = datetime.now()
        if(four_years_ago.day == 29 and four_years_ago.month == 2):
            four_years_ago = four_years_ago.replace(day=28)
        four_years_ago = four_years_ago.replace(year=four_years_ago.year - 4)

        data = models.Activos_Plaqueados.objects.prefetch_related().filter(
            fecha_ingreso__lte=four_years_ago)
        context["rows"] = data
        context["title"] = "Reporte de activos plaqueados con 4 años de antigüedad"
        return context


class Red_Table_View(Table_View):
    target_view = "red-list"
    columns = "__all__"
    model = models.Red
    title = "Red Plaqueados"
    form = RedForm
    columns = ["placa", "serie", "MAC", "IP", "IP6", "IP_switch"]
    exclude = ["id", "activos_plaqueados", "activos_plaqueados"]
