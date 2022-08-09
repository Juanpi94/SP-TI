
from django.forms import ModelForm, DateField, Select, SelectDateWidget, TextInput, Textarea
from django import forms

from backend.models import Activos_No_Plaqueados, Activos_Plaqueados, Funcionarios, Tramites, Ubicaciones
from backend.widgets import DatePickerInput
from django.contrib.auth.models import User


class PlaqueadosForm(ModelForm):
    garantia = DateField(required=False, widget=DatePickerInput)
    ubicacion = forms.ModelChoiceField(
        queryset=Ubicaciones.objects.all(), required=False, to_field_name="lugar")
    detalle = forms.CharField(widget=Textarea(
        attrs={"class": "plaqueadosTextarea"}), label="Detalle")

    class Meta:
        model = Activos_Plaqueados
        help_texts = {
            'garantia': "Formato para fechas: DD/MM/YYYY o DD-MM-YYYY"
        }
        exclude = ["id", "traslado", "tramite"]


class NoPlaqueadosForm(PlaqueadosForm):
    class Meta:
        model = Activos_No_Plaqueados
        help_texts = {
            'garantia': "Formato para fechas: DD/MM/YYYY o DD-MM-YYYY"
        }
        exclude = ["id", "traslado", "tramite"]


class TramitesForm(ModelForm):
    remitente = forms.ModelChoiceField(
        queryset=Funcionarios.objects.all(), to_field_name="nombre_completo")
    recipiente = forms.ModelChoiceField(
        queryset=Funcionarios.objects.all(), to_field_name="nombre_completo")
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
    tramite = forms.ModelChoiceField(queryset=Tramites.objects.all(
    ),  empty_label="--seleccione tramite a cargar", label=None, widget=Select(attrs={'class': 'col-12 tramite-select'}))
    consecutivo = forms.CharField(
        label="Consecutivo:", max_length=100, widget=TextInput(attrs=attrs_col))
    fecha = forms.DateField(widget=DatePickerInput(attrs=attrs_col))
    destino = forms.ModelChoiceField(queryset=Ubicaciones.objects.all(
    ), empty_label="--seleccionar ubicación", label=None, widget=Select(attrs={'class': 'col destino-select'}))
    recipiente = forms.ModelChoiceField(queryset=Funcionarios.objects.all(
    ), empty_label="--Seleccionar recipiente", label="para:", widget=Select(attrs=attrs_col), to_field_name="nombre_completo")
    remitente = forms.ModelChoiceField(queryset=Funcionarios.objects.all(
    ), empty_label="--Seleccionar remitente", label="de:", widget=Select(attrs=attrs_col), to_field_name="nombre_completo")
    motivo = forms.CharField(widget=Textarea(
        attrs={"class": "textarea"}), label="Motivo o Observaciones")
    placa = forms.ModelChoiceField(queryset=Activos_Plaqueados.objects.all(
    ), empty_label="--placa", label="Placa:", to_field_name="id", widget=Select(attrs=attrs_col))
    serie = SerieChoiceField(queryset=Activos_Plaqueados.objects.exclude(
        serie__isnull=True), empty_label="--serie", label="Serie:", to_field_name="id", widget=Select(attrs=attrs_col))


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
