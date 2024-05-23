import django
from .forms import *
from typing import List
from django import forms
from backend import models
from django.apps import apps
from django.views import View
from datetime import datetime
from django.urls import resolve
from django.db.models import F, QuerySet
from backend.custom_types import ColumnDefs
from django.shortcuts import render, redirect
from backend.exceptions import ArgMissingException
from django.forms import DateInput, modelform_factory
from django.shortcuts import render, get_object_or_404
from django.views.generic import RedirectView, TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin


#--Verificacion de lectura de usuario
class ReadPermMixin(LoginRequiredMixin, PermissionRequiredMixin):
    login_url = "/login"
    permission_required = "backend.lectura"

#--Verificacion de escritura de usuario
class WritePermMixin(LoginRequiredMixin, PermissionRequiredMixin):
    login_url = "/login"
    permission_required = "backend.escritura"

#--Redireccionamiento al perfil del usuario
class Perfil_View(LoginRequiredMixin, TemplateView):
    template_name = "auth/perfil.html"

#--Redireccionamiento a la pagina principal
class index(RedirectView):
    pattern_name = "activos_plaqueados"

#--Funcion encargada de cargar los datos a la tabla
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
    exclude_data: bool, optional
        Determina si el arreglo de exclude también excluye los datos enviados por JSON
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
    exclude_data = False
    target_view = None
    defs_order = []

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        self.check_args()

        context["target_view"] = self.target_view
        context["add"] = self.add
        context["edit"] = self.edit
        context["title"] = self.title
        context["custom_script"] = self.custom_script
        context["form"] = self.get_form()
        context["edit_form"] = self.get_edit_form()
        context["data"] = {
            "tabulator": {
                "autoColumns": self.auto_columns,
                "columnDefs": self.get_column_defs(),
                "id_field": self.id_field,
            },
            "data": list(self.get_values()),
        }
        return context

    def check_args(self):
        """
        Revisa si se especificaron las propiedades obligatorias, suelta una excepción si no es así
        :return:
        """
        keys = dir(self)
        non_optional_args = ["model", "target_view"]
        missing_args = [arg for arg in non_optional_args if arg not in keys]

        if len(missing_args):
            raise ArgMissingException(*missing_args)

    def get_queryset(self) -> QuerySet:
        return self.model.objects.all()

    def get_column_defs(self) -> List[ColumnDefs]:
        """
        Las tablas funcionan con la libreria Tabulator, la cuál acepta definiciones de columnas para
        modificar el comportamiento y aspecto de la tabla
        :return: Una lista de diccionarios con definiciones de columnas
        """
        defs = [{"field": "id", "visible": False}]
        ## Encargado de traer los campos en la base e imprimilos en la tabla
        fields: List[any] = self.model._meta.get_fields()
        # print(fields)

        ## Esta es el metodo que se encarga de filtrar ypasar la informacion que se muestra en la tabla
        for field in filter(lambda _field: _field.name != "id" , fields):
            title = field.__dict__.get("verbose_name", field.name)
            defs.append(
                {
                    "field": field.name,
                    "title": title.title(),
                })

        if len(self.exclude) > 0:
            defs = self._parse_column_defs_with_exclusions(defs)
        if len(self.defs_order) > 0:
            defs = self._order_column_defs(defs)

        return defs

    def _parse_column_defs_with_exclusions(
            self, defs: List[ColumnDefs]
    ) -> List[ColumnDefs]:
        """
        Aplica las exclusiones a la lista de definiciones
        :param defs:
        :return:
        """
        filtered_defs = []
        for i in range(len(defs)):
            if defs[i]["field"] not in self.exclude:
                filtered_defs.append(defs[i])
        return filtered_defs

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
        form = type("DynamicModelForm", (django.forms.ModelForm,), {"Meta": meta, **fields})

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
        form = type(
            "DynamicModelForm",
            (django.forms.ModelForm,),
            {"Meta": meta, "__init__": init, **fields},
        )
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
        return {"model": self.model, "fields": "__all__"}

    def get_values(self) -> QuerySet:
        """
        Convierte el queryset de modelos en un queryset de diccionarios
        :return: Queryset de diccionarios
        """
        if len(self.exclude) == 0 or self.exclude_data == False:
            return self.get_queryset().values()
        fields = [f.name for f in self.model._meta.get_fields()]
        fields = list(filter(lambda x: x not in self.exclude, fields))
        return self.get_queryset().values(*fields)

#----------------------------------------------------------------------------------------

##---- Plataforma/Activos ----##

##--Activos Plaqueados
class Activos_Plaqueados_View(Table_View):
    target_view = "activos_plaqueados"
    model = models.Activos_Plaqueados
    title = "Activos plaqueados"
    id_field = "placa"
    defs_order = ["placa"]
    exclude = ["tramites", ]

    def get_form_fields(self) -> dict:
        return {"field_order": ["placa"]}

    def get_form_metafields(self) -> dict:
        metafields = super().get_form_metafields()
        metafields["widgets"] = {
            "garantia": DateInput(
                attrs={
                    "type": "date",
                    "placeholder": "yyyy-mm-dd (DOB)",
                    "class": "date-form-input",
                }
            ),
            "fecha_ingreso": DateInput(
                attrs={
                    "type": "date",
                    "placeholder": "yyyy-mm-dd (DOB)",
                    "class": "date-form-input",
                }
            ),
        }
        return metafields

    def get_values(self) -> QuerySet:
        return super().get_values().annotate(tipo=F('tipo__nombre'), subtipo=F('subtipo__nombre'), 
                                             ubicacion=F('ubicacion__ubicacion'), compra=F('compra__numero_orden_compra'),
                                             red=F('red__MAC'), ubicacion_anterior=F('ubicacion_anterior__ubicacion'),
                                             estado=F('estado__descripcion'))

##--Activos No Plaqueados
class Activos_No_Plaqueados_View(Table_View):
    target_view = "activos_no_plaqueados"
    model = models.Activos_No_Plaqueados
    title = "Activos no plaqueados"
    id_field = "serie"
    defs_order = ["serie", "nombre"]

    def get_form_fields(self) -> dict:
        return {
            "ubicacion": forms.ModelChoiceField(queryset=models.Ubicaciones.objects.all(), required=False),
            "ubicacion_anterior": forms.ModelChoiceField(queryset=models.Ubicaciones.objects.all(), required=False),
            "field_order": ["serie"],
        }

    def get_values(self) -> QuerySet:
        return super().get_values().annotate(serie=F("serie"), tipo=F('tipo__nombre'), subtipo=F('subtipo__nombre'),
                                              compra=F('compra__numero_orden_compra'), red=F('red__MAC'), 
                                              ubicacion=F('ubicacion__ubicacion'), ubicacion_anterior=F('ubicacion_anterior__ubicacion'),
                                              tramites=F('tramites__referencia'))

##--Tipos
class Tipo_View(Table_View):
    target_view = "tipo"
    model = models.Tipo
    title = "Tipos de activos"
    exclude = ["activos_plaqueados", "activos_no_plaqueados"]

##--Subtipos
class Subtipo_View(Table_View):
    target_view = "subtipo"
    model = models.Subtipo
    title = "Subtipos de activos"
    exclude = ["activos_plaqueados", "activos_no_plaqueados"]

##--Compra
class Compra_View(Table_View):
    target_view = "compra"
    model = models.Compra
    title = "Compras"

    exclude = ["activos_plaqueados", "activos_no_plaqueados"]

    def get_values(self) -> QuerySet:
        return super().get_values().annotate(id=F("numero_orden_compra"), proveedor=F('proveedor__nombre'))
 
##--Red   
class Red_Table_View(Table_View):
    target_view = "red"
    model = models.Red
    title = "Red Plaqueados"
    exclude = ["activos_plaqueados", "activos_no_plaqueados"]    

##---- Fin Plataforma/Activos ----##

#----------------------------------------------------------------------------------------

##---- Plataforma/Tramites ----##

#--Generar traslados
class Generar_Traslado_View(WritePermMixin, TemplateView):
    template_name = "generar/traslados.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["form"] = TramitesExportForm()

        ubicaciones_data = models.Ubicaciones.objects.all()
        context["ubicaciones"] = ubicaciones_data.values()

        return context

#--Generar desecho
class Desecho_View(WritePermMixin, TemplateView):
    template_name = "generar/desecho.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["form"] = DesechoExportForm()
        return context

#--Generar traslado a taller
class Taller_View(WritePermMixin, TemplateView):
    template_name = "generar/taller.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["form"] = TallerExportForm()
        return context

#--Ver tramites
class Tramites_View(Table_View):
    target_view = "tramites"
    model = models.Tramites
    add = False
    title = "Tramites"
    exclude = ["activos_plaqueados", "activos_no_plaqueados",
               "traslados", "desecho", "taller"]
    
    def get_values(self) -> QuerySet:
        return super().get_values().annotate(solicitante=F('solicitante__username'), remitente=F('remitente__nombre_completo'),
                                             recipiente=F('recipiente__nombre_completo'), tipo=F('tipo__nombre'),
                                             estado=F('estado__nombre'))

#--Ver traslados
class Traslados_Table_View(Table_View):
    target_view = "traslados"
    title = "Traslados"
    
    def get_values(self) -> QuerySet:
        return super().get_values().annotate(destino=F('destino__ubicacion'), tramite=F('tramite__referencia'))

##---- Fin Plataforma/Tramites ----##

#----------------------------------------------------------------------------------------

##---- Plataforma/Reportes ----##

#--Reporte general Plaqueados
class Reporte_Plaqueados(ReadPermMixin, TemplateView):
    template_name = "reportes/reporte.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        data = models.Activos_Plaqueados.objects.prefetch_related().all()
        context["data"] = list(data.values())
        context["title"] = "Reporte de activos plaqueados"
        return context

#--Reporte general No Plaqueados
class Reporte_No_Plaqueados(ReadPermMixin, TemplateView):
    template_name = "reportes/reporte.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        data = models.Activos_No_Plaqueados.objects.prefetch_related().all()
        context["data"] = list(data.values())
        context["title"] = "Reporte de activos no plaqueados"
        return context

#--Reporte Plaqueados 2 años o mas de antigüedad
class Reporte_Plaqueados_2_old(Reporte_Plaqueados):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        two_years_ago = datetime.now()
        if two_years_ago.day == 29 and two_years_ago.month == 2:
            two_years_ago = two_years_ago.replace(day=28)
        two_years_ago = two_years_ago.replace(year=two_years_ago.year - 2)

        data = models.Activos_No_Plaqueados.objects.all().filter(
            fecha_ingreso__lte=two_years_ago
        )
        context["data"] = list(data.values())
        context["title"] = "Reporte de activos plaqueados con 2 años de antigüedad"
        return context

#--Reporte No Plaqueados 2 años o mas de antigüedad
class Reporte_No_Plaqueados_2_old(Reporte_No_Plaqueados):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        two_years_ago = datetime.now()
        if two_years_ago.day == 29 and two_years_ago.month == 2:
            two_years_ago = two_years_ago.replace(day=28)
        two_years_ago = two_years_ago.replace(year=two_years_ago.year - 2)
        
        data = models.Activos_No_Plaqueados.objects.all().filter(
            fecha_ingreso__lte=two_years_ago
        )
        context["data"] = list(data.values())
        context["title"] = "Reporte de activos no plaqueados con 2 años de antigüedad"

        return context

#--Reporte Plaqueados 4 años o mas de antigüedad
class Reporte_Plaqueados_4_old(Reporte_Plaqueados):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        four_years_ago = datetime.now()
        if four_years_ago.day == 29 and four_years_ago.month == 2:
            four_years_ago = four_years_ago.replace(day=28)
        four_years_ago = four_years_ago.replace(year=four_years_ago.year - 4)

        data = models.Activos_Plaqueados.objects.prefetch_related().filter(
            fecha_ingreso__lte=four_years_ago
        )
        context["data"] = list(data.values())
        context["title"] = "Reporte de activos plaqueados con 4 años de antigüedad"
        return context

#--Reporte No Plaqueados 4 años o mas de antigüedad
class Reporte_No_Plaqueados_4_old(Reporte_No_Plaqueados):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        four_years_ago = datetime.now()
        if four_years_ago.day == 29 and four_years_ago.month == 2:
            four_years_ago = four_years_ago.replace(day=28)
        four_years_ago = four_years_ago.replace(year=four_years_ago.year - 4)

        data = models.Activos_No_Plaqueados.objects.prefetch_related().filter(
            fecha_ingreso__lte=four_years_ago
        )
        context["data"] = list(data.values())
        context["title"] = "Reporte de activos no plaqueados con 4 años de antigüedad"
        return context

##---- Fin Plataforma/Reportes ----##

#----------------------------------------------------------------------------------------

##---- Administracion/Gestión ----##

#--Funcionarios
class Funcionarios_View(Table_View):
    target_view = "funcionarios"
    model = models.Funcionarios
    title = "Funcionarios"
    
    exclude = ['ubicaciones', 'unidades']
    
#--Ubicaciones
class Ubicaciones_View(Table_View):
    target_view = "ubicaciones"
    model = models.Ubicaciones
    title = "Ubicaciones"
    exclude = ["activos_plaqueados", "plaqueados", "activos_no_plaqueados", "no_anterior"]

    def get_values(self) -> QuerySet:
        return super().get_queryset().values().annotate(custodio=F("custodio__nombre_completo"), unidades=F("unidades__nombre"), instalacion=F('instalacion__ubicacion'))
    
#--Unidades
class Unidades_Table_View(Table_View):
    target_view = "unidades"
    title = "Unidades Universitarias"
    model = models.Unidades
    id_field = "codigo"
    
    exclude = 'ubicaciones'
    
    def get_values(self) -> QuerySet:
        return super().get_queryset().values().annotate(coordinador=F("coordinador__nombre_completo"))
    
#--Usuarios
class User_View(Table_View):
    target_view = "user"
    exclude = ["password", "logentry", "tramites",
               "is_superuser", "is_staff", "groups", "user_permissions"]
    exclude_data = True
    model = models.User
    title = "Usuarios"        

#--Proveedores
class Proveedores_Table_View(Table_View):
    target_view = "proveedor"
    title = "Proveedores"
    model = models.Proveedor
    
    exclude = 'compra'

##---- Fin de Administracion/Gestión ----##

#----------------------------------------------------------------------------------------

##---- Administracion/Importar ----##

#--Funcion encargado de enviar la informacion a un archivos
class ImportTemplateView(TemplateView):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        queryparams = self.request.GET
        message = queryparams.get("message")
        error = queryparams.get("error")

        if error:
            error = True if error == "True" else False

        context["message"] = message
        context["error"] = error
        return context

#--Encargado de importar datos de reportes plaqueados desde un excel
class Importar_Reporte_Plaqueados(WritePermMixin, ImportTemplateView):
    template_name = "importar/reportePlaqueados.html"

#--Encargado de importar datos de reportes no plaqueados desde un excel
class Importar_Reporte_No_Plaqueados(WritePermMixin, ImportTemplateView):
    template_name = "importar/reporteNoPlaqueados.html"

##---- Fin de Administracion/Importar ----##

#----------------------------------------------------------------------------------------

#-------------# Area de Pruebas #-------------#  
from django.contrib import messages
        
class EditGenericView(View):
    def get_model_name(self, request):
        # Get the current URL
        current_url = resolve(request.path_info).url_name
        # Assume that the URL name is the same as the model name
        model_name = current_url.split('/')[1] # adjust this as necessary based on your URL structure
        return model_name.lower()   

    def get(self, request, model_name, primary_key):
        if model_name == 'user':
            Model = apps.get_model('auth', model_name)
        else:
            Model = apps.get_model('backend', model_name)
        primary_key_field = Model._meta.pk.name
        model_instance = get_object_or_404(Model, **{primary_key_field: primary_key})
        FormClass = modelform_factory(Model, fields='__all__')
        form = FormClass(instance=model_instance)
        return render(request, 'components/editData.html', {'form': form})

    def post(self, request, model_name, primary_key):
        if model_name == 'user':
            Model = apps.get_model('auth', model_name)
        else:
            Model = apps.get_model('backend', model_name)
        primary_key_field = Model._meta.pk.name
        model_instance = get_object_or_404(Model, **{primary_key_field: primary_key})
        FormClass = modelform_factory(Model, fields='__all__')
        form = FormClass(request.POST, instance=model_instance)
        if form.is_valid():
            form.save()
            messages.success(request, f"{model_name} editado con éxito")
            return redirect(f'/{model_name}/')
        return render(request, 'components/editData.html', {'form': form})

#-----------# Fin Area de Pruebas #-----------#
