from email.policy import default
from tkinter import CASCADE
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from django.db import models
from django.utils.timezone import now
from django.core.validators import MaxValueValidator, MinValueValidator

# Create your models here.


class Tipo(models.Model):
    nombre = models.CharField(max_length=120, null=False)
    detalle = models.CharField(max_length=200, blank=True)

    def __str__(self) -> str:
        return self.nombre


class Subtipo(models.Model):
    nombre = models.CharField(max_length=120, null=False)
    detalle = models.CharField(max_length=200, blank=True)

    def __str__(self) -> str:
        return self.nombre


class Activo(models.Model):
    class Estados(models.TextChoices):
        __empty__ = "--------"
        DESHECHO = "Deshecho", _("Deshecho")
        EN_USO = "En uso", _("En uso")
        FUNCIONAL = "Funcional", _("Funcional")
        OBSOLETO = "Obsoleto", _("Obsoleto")
        OBSOLETO_REVISION = "Obsoleto en revision", _("Obsoleto en revision")
        OBSOLETO_USO = "Obsoleto en uso", _("Obsoleto en uso")
        OBSOLETO_REPUESTO = "Obsoleto en repuesto", _("Obsoleto en repuesto")
        OPTIMO = "Optimo", _("Optimo")
        PROCESO_DESHECHO = "Proceso de deshecho", _("Proceso de deshecho")
        USO_ACADEMICO = "Uso academico", _("Uso academico")
    observacion = models.CharField(max_length=300, blank=True, null=True)
    nombre = models.CharField(max_length=120)
    marca = models.CharField(max_length=200)
    valor = models.CharField(max_length=200, null=True)
    modelo = models.CharField(max_length=200)
    serie = models.CharField(max_length=200, null=True)
    garantia = models.DateField(null=True)
    fecha_ingreso = models.DateField(null=True)
    fecha_registro = models.DateField(auto_now_add=True)
    ubicacion = models.ForeignKey(
        to="Ubicaciones", on_delete=models.DO_NOTHING, null=True)

    tramites = models.ManyToManyField(to="Tramites")

    tipo = models.ForeignKey(Tipo, on_delete=models.SET_NULL, null=True)
    subtipo = models.ForeignKey(
        Subtipo, on_delete=models.SET_NULL, null=True)
    compra = models.ForeignKey("Compra", on_delete=models.SET_NULL, null=True)
    estado = models.CharField(
        max_length=25, choices=Estados.choices, default=Estados.OPTIMO)
    red = models.ForeignKey(to="Red", on_delete=models.SET_NULL, null=True)

    class Meta:
        abstract = True


class Activos_Plaqueados(Activo):
    placa = models.CharField(max_length=30)
    ubicacion_anterior = models.ForeignKey(
        to="Ubicaciones", on_delete=models.DO_NOTHING, null=True, related_name="plaqueados")

    def __str__(self) -> str:
        return self.placa


class Activos_No_Plaqueados(Activo):
    ubicacion_anterior = models.ForeignKey(
        to="Ubicaciones", on_delete=models.DO_NOTHING, null=True, related_name="no_plaqueados")

    def __str__(self) -> str:
        return self.serie


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
    class InstalacionChoices(models.TextChoices):
        __empty__ = "--------"
        ESPARZA = "Esparza", _("Instalación de Esparza")
        COCAL = "Cocal", _("Instalación del Cocal")
    ubicacion = models.CharField(max_length=120, default="NA", unique=True)
    instalacion = models.CharField(
        max_length=10, choices=InstalacionChoices.choices, default=InstalacionChoices.ESPARZA)
    custodio = models.ForeignKey(to=Funcionarios, on_delete=models.DO_NOTHING)
    unidad = models.ForeignKey(
        to="Unidad", on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.ubicacion

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


class Tramites(models.Model):
    class TiposTramites(models.TextChoices):
        __empty__ = "--------"
        TRASLADO = 'Traslado', _('Traslado')
        DESHECHO = 'Deshecho', _('Deshecho')
        TALLER = 'Taller', _('Taller')

    class TiposEstado(models.TextChoices):
        __empty__ = "--------"
        PENDIENTE = 'Pendiente', _('Pendiente')
        FINALIZADO = 'Finalizado', _('Finalizado')
        EN_PROCESO = "En Proceso", _("En Proceso")
        ACEPTADO = "Aceptado", _("Aceptado")
    referencia = models.CharField(max_length=120, unique=True)
    solicitante = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    remitente = models.ForeignKey(
        "Funcionarios", on_delete=models.DO_NOTHING, related_name="+", null=True)
    recipiente = models.ForeignKey(
        "Funcionarios", on_delete=models.DO_NOTHING, related_name="+", null=True)
    tipo = models.CharField(
        max_length=12, choices=TiposTramites.choices, default=TiposTramites.TRASLADO)
    detalles = models.CharField(max_length=900)
    fecha = models.DateField(default=now)
    estado = models.CharField(
        max_length=12, choices=TiposEstado.choices, default=TiposEstado.PENDIENTE)

    def __str__(self) -> str:
        return self.referencia


class Traslados(models.Model):

    destino = models.ForeignKey(
        to=Ubicaciones, on_delete=models.DO_NOTHING, related_name="+")
    tramite = models.ForeignKey(to=Tramites, on_delete=models.CASCADE)
    detalle = models.CharField(max_length=120, default="")

    class Meta:
        verbose_name_plural = "Traslados"


class Deshecho(models.Model):

    tramite = models.ForeignKey(to=Tramites, on_delete=models.CASCADE)

    def __str__(self):
        return self.tramite.referencia


class Taller(models.Model):
    tramite = models.ForeignKey(to=Tramites, on_delete=models.CASCADE)
    destinatario = models.CharField(max_length=200)
    beneficiario = models.CharField(max_length=200)
    autor = models.CharField(max_length=200)


class Compra(models.Model):
    numero_orden_compra = models.CharField(max_length=15, primary_key=True)
    numero_solicitud = models.CharField(max_length=150, blank=True)
    origen_presupuesto = models.CharField(max_length=200, blank=True)
    decision_inicial = models.CharField(max_length=100, blank=True)
    numero_procedimiento = models.CharField(max_length=120, blank=True)
    numero_factura = models.CharField(max_length=120, blank=True)
    proveedor = models.ForeignKey(
        to="Proveedor", on_delete=models.SET_NULL, null=True)
    detalle = models.CharField(max_length=300, blank=True)
    informe_tecnico = models.CharField(max_length=120, blank=True)

    def __str__(self):
        return self.numero_orden_compra


class Red(models.Model):
    MAC = models.CharField(max_length=45, unique=True)
    IP = models.CharField(max_length=20, blank=True, default="")
    IP6 = models.CharField(max_length=40, blank=True, default="")
    IP_switch = models.CharField(max_length=80, blank=True, default="")

    def __str__(self):
        return self.MAC


class Proveedor(models.Model):
    nombre = models.CharField(max_length=230, unique=True)
    telefono = models.CharField(max_length=10)
    correo = models.EmailField()

    def __str__(self) -> str:
        return self.nombre


class Unidad(models.Model):
    codigo = models.CharField(max_length=5, primary_key=True)
    nombre = models.CharField(max_length=120, null=True)
    coordinador = models.ForeignKey(
        to=Funcionarios, on_delete=models.SET_NULL, null=True)
