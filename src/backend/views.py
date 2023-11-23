from datetime import datetime

from django.db.models import F, QuerySet
import django.forms
from django.forms import DateInput
from django import forms
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.views.generic import TemplateView, RedirectView
from backend import models
from backend.exceptions import ArgMissingException
from backend.forms import DeshechoExportForm, TallerExportForm, TramitesExportForm
from backend.serializers import PlaqueadosReportSerializer
from backend.types import ColumnDefs
from typing import List

from django.shortcuts import render


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
    id_field: str
        El valor que utilizan las tablas para relacionarlo con los registros (default=id)
    model : model
        El modelo en el que se basa la tabla
    add: bool, optional
        Determina si habrá o no un formulario para crear registros (default=True)
    edit: bool, optional
        Determina se podrá editar un registro(default=True)
    auto_columns: bool, optional
        Determina si utilizar definiciones automaticas de columnas en tabulator (default=False)
    title : str
        Titulo de la tabla
    exclude: list[str], optional
        Excluye columnas de la tabla
    custom_script: str
        Vinculo hacia un archivo javascript para personalizar una tabla
    defs_order: list[str]
        El orden en el que las columnas se muestran
    """

    template_name = "dinamic/table.html"
    add = True
    id_field = "id"
    edit = True
    auto_columns = False
    title = ""
    custom_script = ""
    model: django.db.models.Model = None
    exclude = []
    target_view = None
    defs_order = []

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
            "tabulator": {
                "autoColumns": self.auto_columns,
                "columnDefs": self.get_column_defs(),
                "id_field": self.id_field, },
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

    def get_column_defs(self) -> List[ColumnDefs]:
        """
        Las tablas funcionan con la libreria Tabulator, la cuál acepta definiciones de columnas para
        modificar el comportamiento y aspecto de la tabla
        :return: Una lista de diccionarios con definiciones de columnas
        """
        defs = [{"field": "id", "visible": False}]
        fields: List[any] = self.model._meta.get_fields()

        for field in filter(lambda _field: _field.name != "id", fields):
            title = field.__dict__.get("verbose_name", field.name)
            defs.append({
                "field": field.name,
                "title": title.title(),
            })

        if len(self.exclude) > 0:
            defs = self._parse_column_defs_with_exclusions(defs)
        if len(self.defs_order) > 0:
            defs = self._order_column_defs(defs)

        return defs

    def _parse_column_defs_with_exclusions(self, defs: List[ColumnDefs]) -> List[ColumnDefs]:
        """
        Aplica las exclusiones a la lista de definiciones
        :param defs:
        :return:
        """
        for i in range(len(defs)):
            defs[i]["visible"] = defs["i"]["field"] in self.exclude
        return defs

    def _order_column_defs(self, defs: List[ColumnDefs]) -> List[ColumnDefs]:
        """
        Ordena las definiciones con respecto a defs_order
        :param defs: Las definiciones a ordenar
        :return: retorna las definiciones
        """
        defs_len = len(defs)

        def sort_function(item: dict):
            try:
                return self.defs_order.index(item["field"])
            except ValueError:
                return defs_len + 1

        defs.sort(key=sort_function)
        return defs

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
        Por defecto, utiliza los mismos parametros que get_form_fields y get_form_metafields
        :return: El formulario para editar
        """
        fields = self.get_form_fields()

        def init(self, *args, **kwargs):
            super(django.forms.ModelForm, self).__init__(*args, **kwargs)
            for field_name, field in self.fields.items():
                field.required = False

        meta = type("Meta", (), self.get_form_metafields())
        form = type("DynamicModelForm", (django.forms.ModelForm,), {
            'Meta': meta,
            '__init__': init,
            **fields
        })
        return form()

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
    id_field = "placa"

    def get_form_fields(self) -> dict:
        return {
            "field_order": ["placa"]
        }

    def get_form_metafields(self) -> dict:
        metafields = super().get_form_metafields()
        metafields["widgets"] = {
            "garantia": DateInput(
                attrs={'type': 'date', "placeholder": "yyyy-mm-dd (DOB)", "class": "date-form-input"}),
            "fecha_ingreso": DateInput(
                attrs={'type': 'date', "placeholder": "yyyy-mm-dd (DOB)", "class": "date-form-input"}),
        }
        return metafields

    def get_column_defs(self) -> List[ColumnDefs]:
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
    target_view = "tramites"
    model = models.Tramites
    add = False
    title = "Tramites"


class Activos_No_Plaqueados_View(Table_View):
    target_view = "no_plaqueados"
    model = models.Activos_No_Plaqueados
    title = "Activos no plaqueados"
    id_field = "serie"
    defs_order = ["serie", "nombre"]

    def get_form_fields(self) -> dict:
        return {
            "ubicacion": forms.ModelChoiceField(queryset=models.Ubicaciones.objects.all(), required=False,
                                                to_field_name="ubicacion"),
            "ubicacion_anterior": forms.ModelChoiceField(queryset=models.Ubicaciones.objects.all(), required=False, ),
            "field_order": ["serie"]
        }

    def get_values(self) -> QuerySet:
        return super().get_values().annotate(id=F("serie"))


class Funcionarios_View(Table_View):
    target_view = "funcionarios"
    model = models.Funcionarios
    title = "Funcionarios"


class Ubicaciones_View(Table_View):
    target_view = "ubicaciones-list"
    model = models.Ubicaciones
    title = "Ubicaciones"


class Generar_Tramite_View(WritePermMixin, TemplateView):
    template_name = "generar/traslados.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = TramitesExportForm()

        ubicaciones_data = models.Ubicaciones.objects.all()
        context["ubicaciones"] = ubicaciones_data.values()

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


class Importar_Reporte_Plaqueados(WritePermMixin, ImportTemplateView):
    template_name = "importar/reportePlaqueados.html"


class Importar_Reporte_No_Plaqueados(WritePermMixin, ImportTemplateView):
    template_name = "importar/reporteNoPlaqueados.html"


class Perfil_View(LoginRequiredMixin, TemplateView):
    template_name = "auth/perfil.html"


class Tipo_View(Table_View):
    target_view = "tipo"
    model = models.Tipo
    title = "Tipos de activos"


class Subtipo_View(Table_View):
    target_view = "subtipo"
    model = models.Subtipo
    title = "Subtipos de activos"


class Compra_View(Table_View):
    target_view = "compra"
    model = models.Compra
    title = "Compras"

    def get_values(self) -> QuerySet:
        qs = super().get_values().annotate(id=F("numero_orden_compra"))
        return qs


class Users_View(Table_View):
    target_view = "user"
    exclude = ["password"]
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
    template_name = "reportes/reporte.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        data = models.Activos_Plaqueados.objects.prefetch_related().all()
        context["data"] = PlaqueadosReportSerializer(data, many=True).data
        context["title"] = "Reporte de activos plaqueados"
        return context


class Reporte_No_Plaqueados(ReadPermMixin, TemplateView):
    template_name = "reportes/reporte.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        data = models.Activos_No_Plaqueados.objects.prefetch_related().all()
        context["data"] = list(data.values())
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
    target_view = "red"
    model = models.Red
    title = "Red Plaqueados"


class Traslados_Table_View(Table_View):
    target_view = "traslados"
    model = models.Traslados
    title = "Traslados"


class Proveedores_Table_View(Table_View):
    target_view = "proveedor"
    title = "Proveedores"
    model = models.Proveedor


class Unidades_Table_View(Table_View):
    target_view = "unidades"
    title = "Unidades Universitarias"
    model = models.Unidad
