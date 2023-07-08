
from django.forms import ModelForm, DateField, Select, SelectDateWidget, TextInput, Textarea
from django import forms


from backend.models import Activos_No_Plaqueados, Activos_Plaqueados, Compra, Deshecho, Funcionarios, Proveedor, Tramites, Traslados, Ubicaciones, Tipo, Subtipo, Red, Unidad
from backend.widgets import DatePickerInput
from django.contrib.auth.models import User
from phonenumber_field.formfields import PhoneNumberField


class PlaqueadosForm(ModelForm):
    garantia = DateField(required=False, widget=DatePickerInput,
                         help_text="Formato para fechas: DD/MM/YYYY o DD-MM-YYYY")
    fecha_ingreso = DateField(required=False, widget=DatePickerInput)
    ubicacion = forms.ModelChoiceField(
        queryset=Ubicaciones.objects.all(), required=False, to_field_name="ubicacion")
    compra = forms.ModelChoiceField(
        queryset=Compra.objects.all(), required=False)
    observacion = forms.CharField(widget=Textarea(
        attrs={"class": "plaqueadosTextarea"}), label="Observación", required=False)

    field_order = ["placa"]

    def __init__(self, *args, **kwargs):
        super(PlaqueadosForm, self).__init__(*args, **kwargs)

        self.fields['tipo'].required = False
        self.fields['subtipo'].required = False
        self.fields['serie'].required = False
        self.fields["red"].required = False
        self.fields["compra"].label = "Número orden compra o referencia"

    class Meta:
        model = Activos_Plaqueados
        help_texts = {
            'garantia': "Formato para fechas: DD/MM/YYYY o DD-MM-YYYY"
        }

        exclude = ["id", "traslado", "tramites", "ubicacion_anterior"]


class NoPlaqueadosForm(PlaqueadosForm):
    field_order = ["serie", "nombre", "marca", "valor", "modelo", "garantia",
                   "fecha_ingreso", "ubicacion", "tipo", "subtipo", "observacion"]

    class Meta:
        model = Activos_No_Plaqueados
        help_texts = {
            'garantia': "Formato para fechas: DD/MM/YYYY o DD-MM-YYYY"
        }
        exclude = ["id", "traslado", "tramites", "ubicacion_anterior"]


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
                                     empty_label="--seleccione tramite a cargar", label=None, widget=Select(attrs={'class': 'col-12 tramite-select'}))
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
    serie = SerieChoiceField(queryset=Activos_No_Plaqueados.objects.all(
    ), empty_label="--serie", label="Serie:", to_field_name="id", widget=Select(attrs=attrs_col))


class DeshechoExportForm(forms.Form):

    deshechos = forms.ModelChoiceField(queryset=Tramites.objects.filter(tipo=Tramites.TiposTramites.DESHECHO),
                                       empty_label="--seleccione tramite a cargar", label=None, widget=Select(attrs={'class': 'col-12 tramite-select'}))
    placa = forms.ModelChoiceField(queryset=Activos_Plaqueados.objects.all(
    ), empty_label="--placa", label="Placa:", to_field_name="id", widget=Select(attrs=attrs_col))
    serie = SerieChoiceField(queryset=Activos_No_Plaqueados.objects.all(
    ), empty_label="--serie", label="Serie:", to_field_name="id", widget=Select(attrs=attrs_col))


class TallerExportForm(forms.Form):
    talleres = forms.ModelChoiceField(queryset=Tramites.objects.filter(tipo=Tramites.TiposTramites.TALLER),
                                      empty_label="--seleccione tramite a cargar", label=None, widget=Select(attrs={'class': 'col-12 tramite-select'}))

    boleta = forms.CharField(
        label="Número de boleta:", max_length=100, widget=TextInput(attrs={"class": 'col-2 taller-input'}))
    fecha = forms.DateField(widget=DatePickerInput(
        attrs={"class": "col-2 taller-input"}))
    motivo = forms.CharField(widget=Textarea(
        attrs={"class": "textarea mt-4"}), label="Motivo o Observaciones")
    placa = forms.ModelChoiceField(queryset=Activos_Plaqueados.objects.all(
    ), empty_label="--placa", label="Placa:", to_field_name="id", widget=Select(attrs=attrs_col))
    serie = SerieChoiceField(queryset=Activos_No_Plaqueados.objects.all(
    ), empty_label="--serie", label="Serie:", to_field_name="id", widget=Select(attrs=attrs_col))


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

