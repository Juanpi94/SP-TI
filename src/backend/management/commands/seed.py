from django.core.management.base import BaseCommand, CommandError
from backend.models import Activos_Plaqueados, Ubicaciones, Funcionarios, User, Tipo, Subtipo, Compra
from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from django.core.management import call_command

import datetime
import json
import os


class Command(BaseCommand):
    help = "Ingresa registros a la base de datos"

    def handle(self, *args, **options):
        call_command("flush")
        self.stdout.write(self.style.SUCCESS("Base de datos limpia!"))
        json_file_path = os.path.join(
            os.path.abspath(os.path.dirname('manage.py')),
            'seed_dump.json'
        )

        with open(json_file_path, encoding="UTF-8") as file:

            # ACTIVO
            data = json.load(file)
            activos = data["activos"]
            registros = len(activos)

            exitos = 0
            for activo in activos:
                db_activo = Activos_Plaqueados()
                db_activo.placa = activo["placa"]
                db_activo.observacion = activo["detalle"] or ""
                db_activo.nombre = activo["nombre"]
                db_activo.marca = activo["marca"]
                db_activo.modelo = activo["modelo"]
                db_activo.serie = activo["serie"]
                db_activo.valor = activo["valor"]
                db_activo.garantia = activo["garantia"]
                db_activo.fecha_ingreso = datetime.datetime.now()
                db_activo.save()
                exitos += 1
            self.stdout.write(self.style.SUCCESS(
                f"Se añadieron {exitos} activos de {registros}"))
            # FUNCIONARIOS
            funcionarios = data["funcionarios"]
            registros = len(funcionarios)
            exitos = 0
            funcionarios_repeated = []

            for funcionario in funcionarios:
                if funcionario["nombre_completo"] == "Vacante":
                    self.stdout.write(self.style.ERROR(
                        f"Funcionario {funcionario['nombre_completo']} tiene un nombre invalido"))
                    continue
                if funcionario["nombre_completo"] in funcionarios_repeated:
                    self.stdout.write(self.style.ERROR(
                        f"Funcionario {funcionario['nombre_completo']} tiene un nombre repetido"))
                    continue
                db_funcionario = Funcionarios()
                db_funcionario.cedula = funcionario["cedula"]
                db_funcionario.nombre_completo = funcionario["nombre_completo"]
                db_funcionario.correo_institucional = funcionario["correo_institucional"]
                db_funcionario.correo_personal = funcionario["correo_personal"]
                db_funcionario.telefono_oficina = funcionario["telefono_personal"]
                db_funcionario.save()
                funcionarios_repeated.append(db_funcionario.nombre_completo)
                exitos += 1
            self.stdout.write(self.style.SUCCESS(
                f"Se añadieron {exitos} funcionarios de {registros}"))
            # UBICACIONES
            ubicaciones = data["ubicaciones"]
            registros = len(ubicaciones)
            exitos = 0
            ubicaciones_repeated = []
            for ubicacion in ubicaciones:
                if ubicacion['ubicacion'] in ubicaciones_repeated:
                    self.stdout.write(self.style.ERROR(
                        f"Ubicacion {ubicacion} tiene un nombre repetido"))
                    continue
                mock_custodio = Funcionarios.objects.get(id=1)
                db_ubicacion = Ubicaciones()
                db_ubicacion.ubicacion = ubicacion["ubicacion"]
                db_ubicacion.custodio = mock_custodio
                db_ubicacion.save()
                ubicaciones_repeated.append(db_ubicacion.ubicacion)
                exitos += 1
            self.stdout.write(self.style.SUCCESS(
                f"Se añadieron {exitos} ubicaciones de {registros}"))
            # USUARIOS
            usuarios = data["usuarios"]
            registros = len(usuarios)
            exitos = 0
            usuarios_repeated = []
            for usuario in usuarios:
                if usuario['username'] in usuarios_repeated:

                    self.stdout.write(self.style.ERROR(
                        f"Usuario {usuario['username']} tiene un nombre de usuario repetido"))
                    continue
                usuarios_repeated.append(usuario["username"])
                User.objects.create_user(
                    username=usuario['username'], email=usuario["email"], password=usuario["password"])
                exitos += 1
            self.stdout.write(self.style.SUCCESS(
                f"Se añadieron {exitos} usuarios de {registros}"))
            # TIPOS
            tipos = data["tipos"]
            registros = len(tipos)
            exitos = 0

            for tipo in tipos:
                tipo_db = Tipo()
                tipo_db.nombre = tipo["tipo"]
                tipo_db.detalle = tipo["detalle_tipo"]
                tipo_db.save()
                exitos += 1

            self.stdout.write(self.style.SUCCESS(
                f"Se añadieron {exitos} tipos de {registros}"))
            # SUBTIPOS
            subtipos = data["subtipos"]
            registros = len(subtipos)
            exitos = 0

            for subtipo in subtipos:
                subtipo_db = Subtipo()
                subtipo_db.nombre = subtipo["subtipo"]
                subtipo_db.detalle = subtipo["detalle_subtipo"]
                subtipo_db.save()
                exitos += 1

            self.stdout.write(self.style.SUCCESS(
                f"Se añadieron {exitos} subtipos de {registros}"))

            # COMPRAS
            compras = data["compras"]
            registros = len(compras)
            exitos = 0

            for compra in compras:
                try:
                    compra_db = Compra()
                    compra_db.numero_orden_compra = compra["orden_compra"]
                    compra_db.origen_presupuesto = compra["origen_presupuesto"]
                    compra_db.decision_inicial = compra["decision_inicial"]
                    compra_db.numero_solicitud = compra["numero_solicitud"]
                    compra_db.numero_factura = compra["numero_factura"]
                    compra_db.telefono_proveedor = compra["telefono_proveedor"]
                    compra_db.proveedor = compra["nombre_proveedor"]
                    compra_db.correo_proveedor = compra["correo_empresa"]
                    compra_db.detalle = compra["detalles_presupuesto"]
                    compra_db.informe_tecnico = compra["informe_tecnico"]
                    compra_db.save()

                    random_activo = Activos_Plaqueados.objects.exclude(
                        compra__isnull=False)[0]
                    random_activo.compra = compra_db
                    random_activo.save()

                    exitos += 1
                except KeyError:
                    self.stdout.write(self.style.ERROR(
                        f"La compra {compra_db.numero_orden_compra} carece de un dato importante"))

            self.stdout.write(self.style.SUCCESS(
                f"Se añadieron {exitos} Compras de {registros}"))

            User.objects.create_superuser(
                username="admin", email="Admin@gmail.com", password="AdminPassword")
            self.stdout.write(self.style.SUCCESS(
                "Se creó super usuario admin"))
            content_type = ContentType(app_label="backend", model="global")
            content_type.save()
            lectura = Permission.objects.create(
                codename="lectura", name="Puede leer los contenidos de la pagina", content_type=content_type)
            escritura = Permission.objects.create(
                codename="escritura", name="Puede escribir contenidos en la pagina", content_type=content_type)
            lector_group = Group.objects.create(name="Lector")
            lector_group.permissions.add(lectura)

            escritor_group = Group.objects.create(name="Escritor")
            escritor_group.permissions.add(escritura)
            escritor_group.permissions.add(lectura)

            lector = User.objects.get(username="Lector")
            lector.groups.add(lector_group)

            self.stdout.write(self.style.SUCCESS(
                "Se crearon permisos"))

            self.stdout.write(self.style.SUCCESS(
                "Se crearon grupos"))
