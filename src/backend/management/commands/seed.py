from django.core.management.base import BaseCommand, CommandError
from django.core.management.color import Style
from faker import Faker

import backend.utils.dateutils
from backend.models import *
from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from django.core.management import call_command

import datetime
import json
import os
from atic.settings import BASE_DIR
from backend.utils.dateutils import try_parse_date

class Command(BaseCommand):
    
    help = "Ingresa registros a la base de datos"
    silent = False

    def write(self, styled_msg: Style):
        if self.silent: return

        self.stdout.write(styled_msg)

    def add_arguments(self, parser):
        parser.add_argument("--no-flush", action="store_true", help="Realizar seed sin eliminar información en la base de datos")
        parser.add_argument("--flush", action="store_true", help="Elimina la información de la base de datos, sin necesitar confirmacion")
        parser.add_argument("--silent", action="store_true", help="Silencia los mensajes por consola")

    def handle(self, *args, **options):
        self.silent = options["silent"]
        if options["no_flush"] is False:
            if options["flush"] is True:
                call_command("flush", "--no-input")
            else:
                call_command("flush")
                self.write(self.style.SUCCESS("Base de datos limpia!"))
        json_file_path = os.path.join(BASE_DIR,
                                      'seed_dump.json'
                                      )
        fake = Faker()
        # Give faker a seed so the provided values are predictable
        Faker.seed(1234)

        with open(json_file_path, encoding="UTF-8") as file:
            data = json.load(file)
            
            #--------------------------------------------------------------------------------
            
            # INSTALACIONES
            instalaciones = data["instalaciones"]
            registros = len(instalaciones)
            exitos = 0

            for instalacion in instalaciones:
                instalacion_db = Instalaciones()
                instalacion_db.ubicacion = instalacion['ubicacion']
                instalacion_db.save()
                exitos += 1

            self.write(self.style.SUCCESS(
                f"Se añadieron {exitos} instalaciones de {registros}"))
            
            #--------------------------------------------------------------------------------
            
            # ESTADOS
            # estados = data["estados"]
            # registros = len(estados)
            # exitos = 0

            # for estado in estados:
            #     estado_db = Estados()
            #     estado_db.descripcion = estado['descripcion']
            #     estado_db.save()
            #     exitos += 1

            # self.write(self.style.SUCCESS(
            #     f"Se añadieron {exitos} estados de {registros}"))
        
            #--------------------------------------------------------------------------------

            # TIPOS_TRAMITES
            tipostramites = data["tipostramites"]
            registros = len(tipostramites)
            exitos = 0

            for tipostramite in tipostramites:
                tipotramite_db = TiposTramites()
                tipotramite_db.nombre = tipostramite['nombre']
                tipotramite_db.save()
                exitos += 1

            self.write(self.style.SUCCESS(
                f"Se añadieron {exitos} tipostramites de {registros}"))
            
            #--------------------------------------------------------------------------------
            
            # TIPOS_ESTADOS
            tiposestados = data["tiposestados"]
            registros = len(tiposestados)
            exitos = 0

            for tipoestado in tiposestados:
                tipoestado_db = TiposEstados()
                tipoestado_db.nombre = tipoestado['nombre']
                tipoestado_db.save()
                exitos += 1

            self.write(self.style.SUCCESS(
                f"Se añadieron {exitos} tiposestados de {registros}"))
            
            #--------------------------------------------------------------------------------

            # Management
            User.objects.create_superuser(
                username="admin", email="Admin@gmail.com", password="AdminPassword")
            self.write(self.style.SUCCESS(
                "Se creó super usuario admin"))