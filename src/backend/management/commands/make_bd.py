import mysql.connector
from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
from django.core.management.color import Style

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Configuración de la conexión
        host = 'localhost'
        user = 'root'
        password = 'root'
        database = 'atic'

        # Conectar a la base de datos
        cnx = mysql.connector.connect(
            host=host,
            user=user,
            password=password
        )

        # Verificar si la base de datos existe
        cursor = cnx.cursor()
        cursor.execute("SHOW DATABASES LIKE '{}'".format(database))
        if cursor.fetchone():
            # La base de datos existe, borramos y creamos de nuevo
            cursor.execute("DROP DATABASE {}".format(database))
            cursor.execute("CREATE DATABASE {} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci".format(database))
        else:
            # La base de datos no existe, creamos una nueva
            cursor.execute("CREATE DATABASE {} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci".format(database))

        # Cerrar la conexión
        cnx.close()

        call_command('makemigrations')
        call_command('migrate')
        call_command('seed', '--flush')