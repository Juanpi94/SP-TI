from email.policy import default
from tkinter import CASCADE

from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _

# Create your models here.

class Tipo(models.Model):
    nombre = models.CharField(max_length=120, null=False)
    detalle = models.CharField(max_length=200, blank=True)

    def __str__(self) -> str:
        return self.nombre.__str__()

    class Meta:
        verbose_name_plural = "Tipos"

class Subtipo(models.Model):
    nombre = models.CharField(max_length=120, null=False)
    detalle = models.CharField(max_length=200, blank=True)

    def __str__(self) -> str:
        return self.nombre.__str__()

    class Meta:
        verbose_name_plural = "Subtipos"

class Estados(models.Model):
    descripcion = models.CharField(max_length=40, verbose_name="Descripción")
    
    def __str__(self) -> str:
        return self.descripcion.__str__()

    class Meta:
        verbose_name_plural = "Estados"

## Acomodar orden segun el documento inventario de activos 
class AbstractActivo(models.Model):
    observacion = models.CharField(max_length=500, blank=True, null=True, verbose_name="Observación")
    nombre = models.CharField(max_length=120, verbose_name="Nombre", blank=False, null=False)
    marca = models.CharField(max_length=200, verbose_name="Marca", blank=True)
    valor_colones = models.DecimalField(max_digits=12, decimal_places=2)
    valor_dolares = models.DecimalField(max_digits=12, decimal_places=2)
    modelo = models.CharField(max_length=200, verbose_name="Modelo", blank=True)
    garantia = models.DateField(null=True, verbose_name="Garantia")
    fecha_ingreso = models.DateField(null=True, verbose_name="Fecha de Ingreso")
    fecha_registro = models.DateField(auto_now_add=True, verbose_name="Fecha de Registro")
    ##Agregar el campo de categoria ForeignKey(to=categoria, not null, blank=False)
    tipo = models.ForeignKey(Tipo, on_delete=models.SET_NULL, null=True, verbose_name="Tipo")
    subtipo = models.ForeignKey(Subtipo, on_delete=models.SET_NULL, blank=True, null=True, verbose_name="Subtipo")
    compra = models.ForeignKey("Compra", on_delete=models.SET_NULL, blank=True, null=True, verbose_name="Compra")
    red = models.ForeignKey(to="Red", on_delete=models.SET_NULL, blank=True, null=True, verbose_name="Red")
    ubicacion = models.ForeignKey(to="Ubicaciones", on_delete=models.DO_NOTHING, blank=True, null=True, verbose_name="Ubicación")
    estado = models.ForeignKey(Estados, on_delete=models.DO_NOTHING, verbose_name="Estados", default='1')
    ##agregar el campo de partida ForeignKey(partida, not null, blank=False)

    class Meta:
        abstract = True

class Activos_Plaqueados(AbstractActivo):
    placa = models.CharField(max_length=20, primary_key=True)
    serie = models.CharField(max_length=200, null=True, blank=False, verbose_name="Serie", unique=True)
    ubicacion_anterior = models.ForeignKey(to="Ubicaciones", on_delete=models.DO_NOTHING, blank=True, null=True, related_name="plaqueados")

    def __str__(self):
        return self.placa

    class Meta:
        verbose_name_plural = "Activos Plaqueados"

class Activos_No_Plaqueados(AbstractActivo):
    serie = models.CharField(max_length=200, primary_key=True)
    ubicacion_anterior = models.ForeignKey(to="Ubicaciones", on_delete=models.DO_NOTHING, blank=True, null=True, related_name="no_plaqueados")

    class Meta:
        verbose_name_plural = "Activos No Plaqueados"

    def __str__(self):
        return self.serie

class Funcionarios(models.Model):
    cedula = models.CharField(max_length=120)
    nombre_completo = models.CharField(max_length=120, unique=True)
    correo_institucional = models.CharField(max_length=120, null=True, blank=True)
    correo_personal = models.CharField(max_length=120, null=True, blank=True)
    telefono_oficina = models.CharField(max_length=120, null=True, blank=True)
    telefono_personal = models.CharField(max_length=120, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Funcionarios"

    def __str__(self):
        return self.nombre_completo

class Instalaciones(models.Model):
    ubicacion = models.CharField(max_length=120, unique=True)
    
    def __str__(self):
        return self.ubicacion

    class Meta:
        verbose_name_plural = "Instalaciones"

class Ubicaciones(models.Model):
    ubicacion = models.CharField(max_length=120, unique=True)
    instalacion = models.ForeignKey(Instalaciones, on_delete=models.DO_NOTHING)
    custodio = models.ForeignKey(Funcionarios, on_delete=models.DO_NOTHING)
    unidades = models.ForeignKey(to="Unidades", on_delete=models.SET_NULL, null=True)

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

    class Meta:
        verbose_name_plural = "Permissions"

class TiposTramites(models.Model):
    nombre = models.CharField(max_length=20, unique=True)
    
    def __str__(self) -> str:
        return self.nombre

    class Meta:
        verbose_name_plural = "TiposTramites"
        
class TiposEstados(models.Model):
    nombre = models.CharField(max_length=20, unique=True)
    
    def __str__(self) -> str:
        return self.nombre

    class Meta:
        verbose_name_plural = "TiposEstados"

class DetallePlacaUbicacion(models.Model):
    tramite = models.ForeignKey('Tramites', on_delete=models.CASCADE)
    detalles_placa = models.ForeignKey('Activos_Plaqueados', on_delete=models.CASCADE)
    ubicacion_actual = models.ForeignKey(Ubicaciones, on_delete=models.CASCADE, related_name='ubicacion_actual_placa')
    ubicacion_futura = models.ForeignKey(Ubicaciones, on_delete=models.CASCADE, related_name='ubicacion_futura_placa')
    
    class Meta:
        verbose_name_plural = "Detalle Placa Ubicacion"
    
class DetalleSerieUbicacion(models.Model):
    tramite = models.ForeignKey('Tramites', on_delete=models.CASCADE)
    detalles_serie = models.ForeignKey(Activos_No_Plaqueados, on_delete=models.CASCADE)
    ubicacion_actual = models.ForeignKey(Ubicaciones, on_delete=models.CASCADE, related_name='ubicacion_actual_serie')
    ubicacion_futura = models.ForeignKey(Ubicaciones, on_delete=models.CASCADE, related_name='ubicacion_futura_serie')
    
    class Meta:
        verbose_name_plural = "Detalle Serie Ubicacion"

class Tramites(models.Model):
    referencia = models.CharField(max_length=120, unique=True)
    solicitante = models.ForeignKey(User, on_delete=models.DO_NOTHING) ## cambiarlo por Elaborado por
    remitente = models.ForeignKey("Funcionarios", on_delete=models.DO_NOTHING, related_name="+", null=True)
    destinatario = models.ForeignKey("Funcionarios", on_delete=models.DO_NOTHING, related_name="+", null=True) ## cambiarlo por Destinatario
    tipo = models.ForeignKey(TiposTramites, on_delete=models.DO_NOTHING)
    estado = models.ForeignKey(TiposEstados, on_delete=models.DO_NOTHING)
    detalles = models.CharField(max_length=200) ## Detalles concatena todos los activos relacionados plaqueados y no
    # obervaciones = models.CharField(max_length=500) ## Observaciones del tramite
    detalles_placa = models.ManyToManyField(to=Activos_Plaqueados, through='DetallePlacaUbicacion', related_name='detalles_placa')
    detalles_serie = models.ManyToManyField(to=Activos_No_Plaqueados, through='DetalleSerieUbicacion', related_name='detalles_serie')
    fecha = models.DateField(default=now)

    def __str__(self) -> str:
        return self.referencia

    class Meta:
        verbose_name_plural = "Tramites"

class Desecho(models.Model):
    tramite = models.ForeignKey(to=Tramites, on_delete=models.CASCADE)

    def __str__(self):
        return self.tramite.referencia

    class Meta:
        verbose_name_plural = "Desechos"

class Taller(models.Model):
    tramite = models.OneToOneField(to=Tramites, on_delete=models.CASCADE, related_name="taller")
    destinatario = models.CharField(max_length=200)
    beneficiario = models.CharField(max_length=200)
    autor = models.CharField(max_length=200)

    class Meta:
        verbose_name_plural = "Talleres"

class Compra(models.Model):
    numero_orden_compra = models.CharField(max_length=40, primary_key=True)
    numero_solicitud = models.CharField(max_length=150, blank=True)
    origen_presupuesto = models.CharField(max_length=200, blank=True)
    decision_inicial = models.CharField(max_length=100, blank=True)
    numero_procedimiento = models.CharField(max_length=120, blank=True)
    numero_factura = models.CharField(max_length=120, blank=True)
    proveedor = models.ForeignKey(to="Proveedor", on_delete=models.SET_NULL, null=True)
    detalle = models.CharField(max_length=300, blank=True)
    informe_tecnico = models.CharField(max_length=120, blank=True)

    def __str__(self):
        return self.numero_orden_compra

    class Meta:
        verbose_name_plural = "Compras"

class Red(models.Model):
    MAC = models.CharField(max_length=45, unique=True)
    IP = models.CharField(max_length=20, blank=True, default="")
    IP6 = models.CharField(max_length=40, blank=True, default="")
    IP_switch = models.CharField(max_length=80, blank=True, default="")

    def __str__(self):
        return self.MAC

    class Meta:
        verbose_name_plural = "Red"

class Proveedor(models.Model):
    nombre = models.CharField(max_length=230, unique=True)
    telefono = models.CharField(max_length=16)
    correo = models.EmailField()

    def __str__(self) -> str:
        return self.nombre

    class Meta:
        verbose_name_plural = "Proveedores"

class Unidades(models.Model):
    codigo = models.CharField(max_length=5, primary_key=True)
    nombre = models.CharField(max_length=120, null=True)
    coordinador = models.ForeignKey(to=Funcionarios, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name_plural = "Unidades"
        
#-------------# Area de Pruebas #-------------#



#-----------# Fin Area de Pruebas #-----------#
        

