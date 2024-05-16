from django.forms import ModelChoiceField, CharField, Form, ModelForm, DateField, Select, HiddenInput, SelectDateWidget, TextInput, Textarea
from backend.models import *
from backend.widgets import DatePickerInput
from django.contrib.auth.models import User
from phonenumber_field.formfields import PhoneNumberField

attrs_col = {"class": "col"}

class TramitesForm(ModelForm):
    remitente = ModelChoiceField(queryset=Funcionarios.objects.all(), to_field_name="nombre_completo", required=False)
    recipiente = ModelChoiceField(queryset=Funcionarios.objects.all(), to_field_name="nombre_completo", required=False)
    solicitante = ModelChoiceField(queryset=User.objects.all(), to_field_name="username")
    detalles = CharField(widget=Textarea(attrs={"class": "detalles-textarea"}))
    class Meta:
        model = Tramites
        exclude = ["id"]
        
class SerieChoiceField(ModelChoiceField):
    def label_from_instance(self, obj):
        print(obj.serie)
        return obj.serie
    
class FuncionariosForm(ModelForm):
    class Meta:
        model = Funcionarios
        exclude = ["id"]


class UnidadForm(ModelForm):
    class Meta:
        model = Unidad
        exclude = ["id"]

class UbicacionesForm(ModelForm):
    
    class Meta:
        model = Ubicaciones
        exclude = ["id"]


class TipoForm(ModelForm):
    class Meta:
        model = Tipo
        exclude = ["id"]


class SubtipoForm(ModelForm):
    class Meta:
        model = Subtipo
        exclude = ["id"]


class CompraForm(ModelForm):
    class Meta:
        model = Compra
        exclude = ["id"]


class UserForm(ModelForm):
    field_order = ["first_name", "last_name", "username", "email"]

    class Meta:
        model = User
        exclude = ["id", "date_joined"]

## ---- De HTML a PDF ---- ##

## Encargado de generar el formulario para Generar traslado

class TramitesExportForm(Form):
    tramite = ModelChoiceField(queryset=Tramites.objects.all(), empty_label="--seleccione tramite a cargar", label=None, widget=Select(attrs={'class': 'col-12 tramite-select'}))
    consecutivo = CharField(label="Consecutivo:", max_length=100, widget=TextInput(attrs={"class": "form-input"}))
    fecha = DateField(widget=DatePickerInput(attrs={"class": "form-input"}))
    destino = ModelChoiceField(queryset=Ubicaciones.objects.all(), empty_label="--seleccionar ubicación", label=None, widget=Select(attrs={'class': 'col destino-select'}))
    recipiente = ModelChoiceField(queryset=Funcionarios.objects.all(), empty_label="--Recipiente--", label="para:", widget=Select(attrs=attrs_col), to_field_name="nombre_completo")
    remitente = ModelChoiceField(queryset=Funcionarios.objects.all(), empty_label="--Remitente--", label="de:", widget=Select(attrs=attrs_col), to_field_name="nombre_completo")
    motivo = CharField(widget=Textarea(attrs={"class": "textarea p-2"}), label="Motivo o Observaciones")
    placa = ModelChoiceField(queryset=Activos_Plaqueados.objects.all(), empty_label="--placa", label="Placa:", to_field_name="placa", widget=Select(attrs=attrs_col))
    serie = SerieChoiceField(queryset=Activos_No_Plaqueados.objects.all(), empty_label="--serie", label="Serie:", to_field_name="serie", widget=Select(attrs=attrs_col))

## Encargado de generar el formulario para Generar desechos
class DeshechoExportForm(Form):
    deshechos = ModelChoiceField(queryset=Tramites.objects.all(), empty_label="--seleccione tramite a cargar", label=None, widget=Select(attrs={'class': 'col-12 tramite-select'}))
    placa = ModelChoiceField(queryset=Activos_Plaqueados.objects.all(), empty_label="--placa", label="Placa:", to_field_name="placa", widget=Select(attrs=attrs_col))
    serie = SerieChoiceField(queryset=Activos_No_Plaqueados.objects.all(),empty_label="--serie", label="Serie:", to_field_name="id", widget=Select(attrs=attrs_col))

## Encargado de generar el formulario para Generar envio a taller
class TallerExportForm(Form):
    talleres = ModelChoiceField(queryset=Tramites.objects.all(), empty_label="--seleccione tramite a cargar", label=None, widget=Select(attrs={'class': 'col-12 tramite-select'}))
    boleta = CharField(label="Número de boleta:", max_length=100, widget=TextInput(attrs={"class": 'col-2 taller-input'}))
    fecha = DateField(widget=DatePickerInput(attrs={"class": "col-2 taller-input"}))
    motivo = CharField(widget=Textarea(attrs={"class": "textarea mt-4"}), label="Motivo o Observaciones")
    placa = ModelChoiceField(queryset=Activos_Plaqueados.objects.all(), empty_label="--placa", label="Placa:", to_field_name="placa", widget=Select(attrs=attrs_col))
    serie = SerieChoiceField(queryset=Activos_No_Plaqueados.objects.all(), empty_label="--serie", label="Serie:", to_field_name="id", widget=Select(attrs=attrs_col))


## ---- Fin De HTML a PDF ---- ##

#-------------# Area de Pruebas #-------------#



#-----------# Fin Area de Pruebas #-----------#