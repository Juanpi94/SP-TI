from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from django.db import models

# Create your models here.

class Activos_Plaqueados(models.Model):
    nombre = models.CharField(max_length=120)
    placa = models.CharField(max_length=7)
    detalle = models.CharField(max_length=300)
    marca = models.CharField(max_length=200)
    serie = models.CharField(max_length=200, null=True)
    valor = models.CharField(max_length=200, null=True)
    modelo = models.CharField(max_length=200)
    garantia = models.DateField(null=True)
    ubicacion = models.ForeignKey(to="Ubicaciones", on_delete=models.DO_NOTHING, null=True)
    tramite = models.ForeignKey(to="Tramites", on_delete=models.SET_NULL, null=True, related_name="activos")
    def __str__(self) -> str:
        return self.placa

class Tramites(models.Model):
    class TiposTramites(models.TextChoices):
        TRASLADO = 'Traslado', _('Traslado')
        DESHECHO = 'Deshecho', _('Deshecho')
        TALLER = 'Taller', _('Taller')

    class TiposEstado(models.TextChoices):
        PENDIENTE = 'Pendiente', _('Pendiente')
        FINALIZADO = 'Finalizado', _('Finalizado')
    referencia = models.CharField(max_length=120, unique=True)
    solicitante = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    remitente = models.ForeignKey("Funcionarios", on_delete=models.DO_NOTHING, related_name="+")
    recipiente = models.ForeignKey("Funcionarios", on_delete=models.DO_NOTHING, related_name="+")
    tipo = models.CharField(max_length=12, choices=TiposTramites.choices, default=TiposTramites.TRASLADO)
    detalles = models.CharField(max_length=300)
    fecha = models.DateField(auto_now_add=True)
    estado = models.CharField(max_length=12, choices=TiposEstado.choices, default=TiposEstado.PENDIENTE)

    def __str__(self) -> str:
        return self.referencia
class Funcionarios(models.Model):
    cedula = models.CharField(max_length=120)
    nombre_completo = models.CharField(max_length=120)
    correo_institucional = models.CharField(max_length=120, null=True)
    correo_personal = models.CharField(max_length=120, null=True)
    telefono_oficina = models.CharField(max_length=120, null=True)
    telefono_personal = models.CharField(max_length=120, null=True)

    def __str__(self):
        return self.nombre_completo
    

class Ubicaciones(models.Model):

    class SedeChoices(models.TextChoices):
        ESPARZA = "E", _("Sede de Esparza")
        COCAL = "C", _("Sede del Cocal")
    lugar = models.CharField(max_length=120)
    sede = models.CharField(max_length=2, choices=SedeChoices.choices, default=SedeChoices.ESPARZA)
    custodio = models.ForeignKey(to=Funcionarios, on_delete=models.DO_NOTHING)

    def __str__(self):
        return self.lugar


class Traslados(models.Model):
    fecha = models.DateField(auto_now_add=True)
    destino = models.ForeignKey(to=Ubicaciones, on_delete=models.DO_NOTHING, related_name="+")
    activo = models.ForeignKey(to=Activos_Plaqueados, on_delete=models.DO_NOTHING, related_name="+")
