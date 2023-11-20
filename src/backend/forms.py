from django.forms import ModelForm, DateField, Select, HiddenInput, SelectDateWidget, TextInput, Textarea
from django import forms

from backend.models import Compra, Deshecho, Funcionarios, Proveedor, \
    Tramites, Traslados, Ubicaciones, Tipo, Subtipo, Red, Unidad, Activos_Plaqueados, Activos_No_Plaqueados
from backend.widgets import DatePickerInput
from django.contrib.auth.models import User
from phonenumber_field.formfields import PhoneNumberField


class TramitesForm(ModelForm):
    remitente = forms.ModelChoiceField(
        queryset=Funcionarios.objects.all(), to_field_name="nombre_completo", required=False)
    recipiente = forms.ModelChoiceField(
        queryset=Funcionarios.objects.all(), to_field_name="nombre_completo", required=False)
    solicitante = forms.ModelChoiceField(
        queryset=User.objects.all(), to_field_name="username")
    detalles = forms.CharField(widget=Textarea(
        attrs={"class": "detalles-textarea"}))

    class Meta:
        model = Tramites
        exclude = ["id"]


attrs_col = {"class": "col"}


class SerieChoiceField(forms.ModelChoiceField):
    def label_from_instance(self, obj):
        return obj.serie


class TramitesExportForm(forms.Form):
    tramite = forms.ModelChoiceField(queryset=Tramites.objects.filter(tipo=Tramites.TiposTramites.TRASLADO),
                                     empty_label="--seleccione tramite a cargar", label=None,
                                     widget=Select(attrs={'class': 'col-12 tramite-select'}))
    consecutivo = forms.CharField(
        label="Consecutivo:", max_length=100, widget=TextInput(attrs={"class": "form-input"}))
    fecha = forms.DateField(widget=DatePickerInput(attrs={"class": "form-input"}))
    destino = forms.ModelChoiceField(queryset=Ubicaciones.objects.all(
    ), empty_label="--seleccionar ubicación", label=None, widget=Select(attrs={'class': 'col destino-select'}))
    recipiente = forms.ModelChoiceField(queryset=Funcionarios.objects.all(
    ), empty_label="--Recipiente--", label="para:", widget=Select(attrs=attrs_col), to_field_name="nombre_completo")
    remitente = forms.ModelChoiceField(queryset=Funcionarios.objects.all(
    ), empty_label="--Remitente--", label="de:", widget=Select(attrs=attrs_col), to_field_name="nombre_completo")
    motivo = forms.CharField(widget=Textarea(
        attrs={"class": "textarea p-2"}), label="Motivo o Observaciones")
    placa = forms.ModelChoiceField(queryset=Activos_Plaqueados.objects.all(
    ), empty_label="--placa", label="Placa:", to_field_name="id", widget=Select(attrs=attrs_col))
    serie = SerieChoiceField(queryset=Activos_No_Plaqueados.objects.all(
    ), empty_label="--serie", label="Serie:", to_field_name="id", widget=Select(attrs=attrs_col))


class DeshechoExportForm(forms.Form):
    deshechos = forms.ModelChoiceField(queryset=Tramites.objects.filter(tipo=Tramites.TiposTramites.DESHECHO),
                                       empty_label="--seleccione tramite a cargar", label=None,
                                       widget=Select(attrs={'class': 'col-12 tramite-select'}))
    placa = forms.ModelChoiceField(queryset=Activos_Plaqueados.objects.all(
    ), empty_label="--placa", label="Placa:", to_field_name="id", widget=Select(attrs=attrs_col))
    serie = SerieChoiceField(queryset=Activos_No_Plaqueados.objects.all(),
                             empty_label="--serie", label="Serie:", to_field_name="id", widget=Select(attrs=attrs_col))


class TallerExportForm(forms.Form):
    talleres = forms.ModelChoiceField(queryset=Tramites.objects.filter(tipo=Tramites.TiposTramites.TALLER),
                                      empty_label="--seleccione tramite a cargar", label=None,
                                      widget=Select(attrs={'class': 'col-12 tramite-select'}))

    boleta = forms.CharField(
        label="Número de boleta:", max_length=100, widget=TextInput(attrs={"class": 'col-2 taller-input'}))
    fecha = forms.DateField(widget=DatePickerInput(
        attrs={"class": "col-2 taller-input"}))
    motivo = forms.CharField(widget=Textarea(
        attrs={"class": "textarea mt-4"}), label="Motivo o Observaciones")
    placa = forms.ModelChoiceField(queryset=Activos_Plaqueados.objects.all(
    ), empty_label="--placa", label="Placa:", to_field_name="id", widget=Select(attrs=attrs_col))
    serie = SerieChoiceField(queryset=Activos_No_Plaqueados.objects.all(),
                             empty_label="--serie", label="Serie:", to_field_name="id", widget=Select(attrs=attrs_col))


class FuncionariosForm(forms.ModelForm):
    class Meta:
        model = Funcionarios
        exclude = ["id"]


class UbicacionesForm(forms.ModelForm):
    custodio = forms.ModelChoiceField(
        queryset=Funcionarios.objects.all(), to_field_name="nombre_completo")

    class Meta:
        model = Ubicaciones
        exclude = ["id"]


class TipoForm(forms.ModelForm):
    class Meta:
        model = Tipo
        exclude = ["id"]


class SubtipoForm(forms.ModelForm):
    class Meta:
        model = Subtipo
        exclude = ["id"]


class CompraForm(forms.ModelForm):
    class Meta:
        model = Compra
        exclude = ["id"]


class UserForm(ModelForm):
    field_order = ["first_name", "last_name", "username", "email"]

    class Meta:
        model = User
        exclude = ["id", "date_joined"]
