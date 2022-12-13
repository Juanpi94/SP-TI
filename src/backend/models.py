from email.policy import default
from tkinter import CASCADE
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from django.db import models

# Create your models here.


class Tipo(models.Model):
    nombre = models.CharField(max_length=120, null=False)

    def __str__(self) -> str:
        return self.nombre


class Subtipo(models.Model):
    nombre = models.CharField(max_length=120, null=False)
    tipo = models.ForeignKey(Tipo, on_delete=models.CASCADE)

    def __str__(self) -> str:
        return self.nombre


class Activo(models.Model):
    detalle = models.CharField(max_length=300)
    marca = models.CharField(max_length=200)
    serie = models.CharField(max_length=200, null=True)
    valor = models.CharField(max_length=200, null=True)
    modelo = models.CharField(max_length=200)
    garantia = models.DateField(null=True)
    fecha = models.DateField(null=True)
    observacion = models.CharField(max_length=300, default="", null=True)
    ubicacion = models.ForeignKey(
        to="Ubicaciones", on_delete=models.DO_NOTHING, null=True)
    tramite = models.ForeignKey(
        to="Tramites", on_delete=models.SET_NULL, null=True)
    nombre = models.CharField(max_length=120)
    tipo = models.OneToOneField(Tipo, on_delete=models.SET_NULL, null=True)
    subtipo = models.OneToOneField(
        Subtipo, on_delete=models.SET_NULL, null=True)

    class Meta:
        abstract = True


class Activos_Plaqueados(Activo):
    placa = models.CharField(max_length=7)

    def __str__(self) -> str:
        return self.placa


class Activos_No_Plaqueados(Activo):
    tramite = models.ForeignKey(
        to="Tramites", on_delete=models.SET_NULL, null=True, related_name="activos_sin_placa")

    def __str__(self) -> str:
        return self.serie


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
    remitente = models.ForeignKey(
        "Funcionarios", on_delete=models.DO_NOTHING, related_name="+")
    recipiente = models.ForeignKey(
        "Funcionarios", on_delete=models.DO_NOTHING, related_name="+")
    tipo = models.CharField(
        max_length=12, choices=TiposTramites.choices, default=TiposTramites.TRASLADO)
    detalles = models.CharField(max_length=900)
    fecha = models.DateField(auto_now_add=True)
    estado = models.CharField(
        max_length=12, choices=TiposEstado.choices, default=TiposEstado.PENDIENTE)

    def __str__(self) -> str:
        return self.referencia


class Funcionarios(models.Model):
    cedula = models.CharField(max_length=120)
    nombre_completo = models.CharField(max_length=120, unique=True)
    correo_institucional = models.CharField(
        max_length=120, null=True, blank=True)
    correo_personal = models.CharField(max_length=120, null=True, blank=True)
    telefono_oficina = models.CharField(max_length=120, null=True, blank=True)
    telefono_personal = models.CharField(max_length=120, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Funcionarios"

    def __str__(self):
        return self.nombre_completo


class Ubicaciones(models.Model):
    class SedeChoices(models.TextChoices):
        ESPARZA = "Esparza", _("Sede de Esparza")
        COCAL = "Cocal", _("Sede del Cocal")
    localizacion = models.CharField(max_length=120, default="NA")
    nombre = models.CharField(max_length=120, unique=True)
    sede = models.CharField(
        max_length=10, choices=SedeChoices.choices, default=SedeChoices.ESPARZA)
    custodio = models.ForeignKey(to=Funcionarios, on_delete=models.DO_NOTHING)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name_plural = "Ubicaciones"


class Permissions(models.Model):
    pass

    class Meta:
        permissions = [
            ("lectura", "puede ingresar a las vistas"),
            ("escritura", "puede manipular datos por medio de las vistas"),
            ("respaldos", "puede respaldar la base de datos")
        ]


class Traslados(models.Model):
    fecha = models.DateField(auto_now_add=True)
    destino = models.ForeignKey(
        to=Ubicaciones, on_delete=models.DO_NOTHING, related_name="+")
    activo = models.ForeignKey(
        to=Activos_Plaqueados, on_delete=models.SET_NULL, null=True, related_name="+")

    def __str__(self) -> str:
        if(self.activo):
            return f"Traslado de activo {self.activo.placa or self.activo.serie}"
        return f"Traslado sin activo"

    class Meta:
        verbose_name_plural = "Traslados"


class Deshecho(models.Model):
    referencia = models.CharField(max_length=120, unique=True)
    fecha = models.DateField(auto_now_add=True)
    activos_plaqueados = models.ManyToManyField(Activos_Plaqueados)
    activos_no_plaqueados = models.ManyToManyField(
        Activos_No_Plaqueados)


class Compra(models.Model):
    numero_solicitud = models.CharField(max_length=150)
    origen_presupuesto = models.CharField(max_length=200)
    decisión_final = models.CharField(max_length=100)
    numero_procedimiento = models.CharField(max_length=120)
    numero_factura = models.CharField(max_length=120)
    proveedor = models.CharField(max_length=300)
    telefono_proveedor = models.CharField(max_length=100)
    correo_proveedor = models.CharField(max_length=120)
