from datetime import datetime

from django.db.models import F, QuerySet
import django.forms
from django.forms import DateInput
from django.http import HttpResponseNotFound

from django.urls import reverse
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.views.generic import TemplateView, RedirectView
from rest_framework.viewsets import ModelViewSet

from backend import models
from backend.api_views import PlaqueadosApiViewset
from backend.exceptions import ArgMissingException
from backend.forms import DeshechoExportForm, TallerExportForm, TramitesExportForm
from backend.routers import api_router
from backend.types import ColumnDefs, HorizontalAligns


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
        El basename del target api view
    model : model
        El modelo en el que se basa la tabla
    add: bool, optional
        Determina si habrá o no un formulario para crear registros (default=True)
    edit: bool, optional
        Determina se podrá editar un registro(default=True)
    title : str
        Titulo de la tabla
    exclude: list[str], optional
        Excluye columnas de la tabla
    custom_script: str
        Vinculo hacia un archivo javascript para personalizar una tabla
    """

    template_name = "dinamic/table.html"
    add = True
    edit = True
    title = ""
    custom_script = ""
    model: django.db.models.Model = None
    exclude = []
    target_view = None

    def post(self, request):
        if (not request.POST["id"]):
            return HttpResponseNotFound()

        object = self.model.objects.get(id=request.POST["id"])
        form = self.get_edit_form()
        form.initial = object
        pass

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        self.check_args()

        context["target_view"] = self.target_view
        context['add'] = self.add
        context["edit"] = self.edit
        context["title"] = self.title
        context["custom_script"] = self.custom_script
        context["form"] = self.get_form()
        context["edit_form"] = self.get_edit_form()
        context["data"] = {
            "columnDefs": self.get_column_defs(),
            "data": list(self.get_values())}
        return context

    def check_args(self):
        """
        Revisa si se especificaron las propiedades obligatorias, suelta una excepción si no es así
        :return:
        """
        keys = dir(self)
        non_optional_args = ["model", "target_view"]
        missing_args = [arg for arg in non_optional_args if arg not in keys]

        if (len(missing_args)):
            raise ArgMissingException(*missing_args)

    def get_queryset(self):
        return self.model.objects.all()

    def get_column_defs(self) -> list[ColumnDefs]:
        """
        Las tablas funcionan con la libreria Tabulator, la cuál acepta definiciones de columnas para
        modificar el comportamiento y aspecto de la tabla
        :return: Una lista de diccionarios con definiciones de columnas
        """
        defs = [{"field": "id", "visible": False}]
        fields: list[any] = self.model._meta.get_fields()

        for field in filter(lambda _field: _field.name != "id", fields):
            defs.append({
                "field": field.name,
                "title": field.verbose_name.title() or field.name.title(),
            })

        if len(self.exclude) > 0:
            return self._parse_column_defs_with_exclusions(defs)
        return defs

    def _parse_column_defs_with_exclusions(self, defs: list[ColumnDefs]) -> list[ColumnDefs]:
        """
        Aplica las exclusiones a la lista de definiciones
        :param defs:
        :return:
        """
        new_defs: list[ColumnDefs] = []

        for col_def in defs:
            new_defs.append({
                "visible": col_def["field"] not in self.exclude,
                **col_def
            })
        return new_defs

    def get_form(self) -> django.forms.ModelForm:
        """
        Genera una clase basada en el modelo automaticamente
        :returns: La clase formulario
        """
        fields = self.get_form_fields()
        meta = type("Meta", (), self.get_form_metafields())
        form = type("DynamicModelForm", (django.forms.ModelForm,), {
            'Meta': meta,
            **fields
        })

        return form()

    def get_edit_form(self):
        """
        Genera una clase basada en el modelo automaticamente, para las ediciones
        Por defecto retorna el mismo formulario que get_form
        :return: El formulario para editar
        """
        return self.get_form()

    def get_form_fields(self) -> dict:
        """
        Genera los campos utilizados por el formulario
        :return: Retorna los campos utilizados a la hora de inicializar el formulario
        """
        return {}

    def get_form_metafields(self) -> dict:
        """
        Genera los campos Meta del formulario
        :return:  Los campos Meta del formulario
        """
        return {
            "model": self.model,
            "fields": "__all__"
        }

    def get_values(self) -> QuerySet:
        """
        Convierte el queryset de modelos en un queryset de diccionarios
        :return: Queryset de diccionarios
        """
        return self.get_queryset().values()


class Activos_Plaqueados_View(Table_View):
    target_view = "plaqueados"
    model = models.Activos_Plaqueados
    title = "Activos plaqueados"
    custom_script = "dist/js/table/activosCustom.js"

    def get_form_metafields(self) -> dict:
        metafields = super().get_form_metafields()
        metafields["widgets"] = {
            "garantia": DateInput(
                attrs={'type': 'date', "placeholder": "yyyy-mm-dd (DOB)", "class": "date-form-input"}),
            "fecha_ingreso": DateInput(
                attrs={'type': 'date', "placeholder": "yyyy-mm-dd (DOB)", "class": "date-form-input"}),
        }
        return metafields

    def get_values(self) -> QuerySet:
        return self.get_queryset().values("id", "nombre", "tipo__nombre", "subtipo__nombre", "ubicacion__ubicacion",
                                          "marca",
                                          "modelo", "valor", "garantia",
                                          "observacion")

    def get_column_defs(self) -> list[ColumnDefs]:
        defs = super().get_column_defs()
        defs.extend([
            {
                "field": "ubicacion__ubicacion",
                "title": "Ubicacion",
            },
            {
                "field": "tipo__nombre",
                "title": "Tipo",
            },
            {
                "field": "subtipo__nombre",
                "title": "Subtipo"
            }
        ])
        return defs


class Tramites_View(Table_View):
    target_view = "tramites-list"
    columns = ["referencia", "activos_plaqueados", "activos_no_plaqueados",
               "solicitante", "tipo", "detalles", "fecha", "estado"]
    exclude = ["id", "activos",
               "traslados", "deshecho"]
    model = models.Tramites

    add = False
    title = "Tramites"


class Activos_No_Plaqueados_View(Table_View):
    target_view = "no_plaqueados-list"
    columns = ["serie", "nombre", "marca",
               "modelo", "valor", "garantia", "observacion"]
    exclude = ["id", "deshecho", "fecha_ingreso", "tramites"]
    model = models.Activos_No_Plaqueados

    title = "Activos no plaqueados"
    custom_script = "dist/js/table/activosCustom.js"


class Funcionarios_View(Table_View):
    target_view = "funcionarios-list"
    columns = "__all__"
    exclude = ["id", "ubicaciones"]
    model = models.Funcionarios

    title = "Funcionarios"


class Ubicaciones_View(Table_View):
    target_view = "ubicaciones-list"
    columns = "__all__"
    exclude = ["id", "activos_plaqueados",
               "activos_no_plaqueados", "plaqueados", "no_plaqueados"]
    model = models.Ubicaciones

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

        if (error):
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

    title = "Tipos de activos"


class Subtipo_View(Table_View):
    target_view = "subtipo-list"
    columns = "__all__"
    exclude = ["id", "activos_plaqueados", "activos_no_plaqueados"]
    model = models.Subtipo

    title = "Subtipos de activos"


class Compra_View(Table_View):
    target_view = "compra-list"
    columns = "__all__"
    exclude = ["id", "activos_plaqueados", "activos_no_plaqueados"]
    model = models.Compra

    title = "Compras"


class Users_View(Table_View):
    target_view = "user-list"
    columns = ["nombre", "username"]
    exclude = ["id", "password"]
    model = models.User

    title = "Usuarios"


class Deshecho_View(WritePermMixin, TemplateView):
    template_name = "generar/deshecho.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = DeshechoExportForm()
        return context


class Taller_View(WritePermMixin, TemplateView):
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
        if (two_years_ago.day == 29 and two_years_ago.month == 2):
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
        if (four_years_ago.day == 29 and four_years_ago.month == 2):
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
        if (two_years_ago.day == 29 and two_years_ago.month == 2):
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
        if (four_years_ago.day == 29 and four_years_ago.month == 2):
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

    columns = ["placa", "serie", "MAC", "IP", "IP6", "IP_switch"]
    exclude = ["id", "activos_plaqueados", "activos_plaqueados"]


class Traslados_Table_View(Table_View):
    target_view = "traslados-list"
    columns = ["destino_proximo", "tramite", "detalle",
               "activos_plaqueados", "activos_no_plaqueados"]
    model = models.Traslados
    title = "Traslados"

    exclude = ["id"]


class Proveedores_Table_View(Table_View):
    target_view = "proveedor-list"
    columns = "__all__"
    exclude = ["id", "compra"]
    title = "Proveedores"
    model = models.Proveedor


class Unidades_Table_View(Table_View):
    target_view = "unidades-list"
    columns = "__all__"
    exclude = ["id", "ubicaciones"]
    title = "Unidades Universitarias"
    model = models.Unidad
