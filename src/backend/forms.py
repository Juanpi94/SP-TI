from django.forms import ModelChoiceField, CharField, Form, ChoiceField, ModelForm, DateField, Select, HiddenInput, SelectDateWidget, TextInput, Textarea
from backend.models import *
from backend.widgets import DatePickerInput
from django.contrib.auth.models import User
from phonenumber_field.formfields import PhoneNumberField

attrs_col = {"class": "col"}

# class TramitesForm(ModelForm):
#     remitente = ModelChoiceField(queryset=Funcionarios.objects.all(), to_field_name="nombre_completo", required=False)
#     destinatario = ModelChoiceField(queryset=Funcionarios.objects.all(), to_field_name="nombre_completo", required=False)
#     solicitante = ModelChoiceField(queryset=User.objects.all(), to_field_name="username")
#     detalles = ModelChoiceField(queryset=Activos_Plaqueados.objects.all(), to_field_name="Placas")
    
#     class Meta:
#         model = Tramites
#         fields = "__all__"
        
class SerieChoiceField(ModelChoiceField):
    def label_from_instance(self, obj):
        return obj.serie
    
# class FuncionariosForm(ModelForm):
#     class Meta:
#         model = Funcionarios
#         exclude = ["id"]


# class UnidadForm(ModelForm):
#     class Meta:
#         model = Unidades
#         exclude = ["codigo"]

# class UbicacionesForm(ModelForm):
    
#     class Meta:
#         model = Ubicaciones
#         exclude = ["id"]


# class TipoForm(ModelForm):
#     class Meta:
#         model = Tipo
#         exclude = ["id"]


# class SubtipoForm(ModelForm):
#     class Meta:
#         model = Subtipo
#         exclude = ["id"]


# class CompraForm(ModelForm):
#     class Meta:
#         model = Compra
#         exclude = ["id"]


# class UserForm(ModelForm):
#     field_order = ["first_name", "last_name", "username", "email"]

#     class Meta:
#         model = User
#         exclude = ["id", "date_joined", "last_login"]
        

## ---- De HTML a PDF ---- ##

class UserModelChoiceField(ModelChoiceField):
    def label_from_instance(self, obj):
        return f"{obj.username} ({obj.id})"

## Encargado de generar el formulario para Generar traslado
class TramitesExportForm(Form):
    tramite = ModelChoiceField(queryset=Tramites.objects.all(), empty_label="--seleccione tramite a cargar", label=None, widget=Select(attrs={'class': 'col-12 tramite-select'}))
    consecutivo = CharField(label="Consecutivo:", max_length=100, widget=TextInput(attrs={"class": "form-input"}))
    fecha = DateField(widget=DatePickerInput(attrs={"class": "form-input"}))
    solicitante = ModelChoiceField(queryset=User.objects.all(), empty_label="--Solicitante--", label="Solicitante:", widget=Select(attrs=attrs_col), to_field_name="username")
    destino = ModelChoiceField(queryset=Ubicaciones.objects.all(), empty_label="--seleccionar ubicación", label=None, widget=Select(attrs={'class': 'col destino-select'}))
    
    funcionarios = Funcionarios.objects.all()
    opciones = [(f.id, f.nombre_completo) for f in funcionarios]
    opciones.insert(0, ('', '--Seleccione--'))  # Add empty option at the beginning
    
    destinatario = ChoiceField(choices=opciones, label="Para:", widget=Select(attrs=attrs_col))
    remitente = ChoiceField(choices=opciones, label="De:", widget=Select(attrs=attrs_col))
    
    motivo = CharField(widget=Textarea(attrs={"class": "textarea p-2"}), label="Motivo o Observaciones")
    placa = ModelChoiceField(queryset=Activos_Plaqueados.objects.all(), empty_label="--placa", label="Placa:", to_field_name="placa", widget=Select(attrs=attrs_col))
    serie = SerieChoiceField(queryset=Activos_No_Plaqueados.objects.all(), empty_label="--serie", label="Serie:", to_field_name="serie", widget=Select(attrs=attrs_col))

## Encargado de generar el formulario para Generar desechos
class DesechoExportForm(Form):
    desechos = ModelChoiceField(queryset=Tramites.objects.all(), empty_label="--seleccione tramite a cargar", label=None, widget=Select(attrs={'class': 'col-12 tramite-select'}))
    placa = ModelChoiceField(queryset=Activos_Plaqueados.objects.all(), empty_label="--placa", label="Placa:", to_field_name="placa", widget=Select(attrs=attrs_col))
    serie = SerieChoiceField(queryset=Activos_No_Plaqueados.objects.all(),empty_label="--serie", label="Serie:", to_field_name="serie", widget=Select(attrs=attrs_col))

## Encargado de generar el formulario para Generar envio a taller
class TallerExportForm(Form):
    talleres = ModelChoiceField(queryset=Tramites.objects.all(), empty_label="--seleccione tramite a cargar", label=None, widget=Select(attrs={'class': 'col-12 tramite-select'}))
    boleta = CharField(label="Número de boleta:", max_length=100, widget=TextInput(attrs={"class": 'col-2 taller-input'}))
    fecha = DateField(widget=DatePickerInput(attrs={"class": "col-2 taller-input"}))
    motivo = CharField(widget=Textarea(attrs={"class": "textarea mt-4"}), label="Motivo o Observaciones")
    placa = ModelChoiceField(queryset=Activos_Plaqueados.objects.all(), empty_label="--placa", label="Placa:", to_field_name="placa", widget=Select(attrs=attrs_col))
    serie = SerieChoiceField(queryset=Activos_No_Plaqueados.objects.all(), empty_label="--serie", label="Serie:", to_field_name="serie", widget=Select(attrs=attrs_col))


## ---- Fin De HTML a PDF ---- ##

#-------------# Area de Pruebas #-------------#



#-----------# Fin Area de Pruebas #-----------#