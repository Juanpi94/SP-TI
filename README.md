# ATIC: Herramienta para la gestión de activos de la UCR

## Requisitos

- Tener instalado Python3 https://www.python.org/downloads/
- Tener instalado Node JS https://nodejs.org/es/
- De forma preferible contar con el editor de código VSCode https://code.visualstudio.com/

## Pasos para configurar el proyecto

1. Crear un archivo con el nombre .env, luego copiar y pegar el texto de .env.template a ese archivo
2. Colocar el secret en ese .env
3. Crear un ambiente virtual de python con los siguientes comandos, desde la raiz del proyecto:

```
mkdir venv
python -m venv ./venv
```

4. Asegurese que su terminal está utilizando el ambiente virtual creado previamente (Este paso tiene que realizarse cada vez que utilice el proyecto):

```
call ./venv/Scripts/activate.bat
#O si está en un entorno linux o con wsl
source ./venv/Scripts/activate
```

5. instalar las dependencias de python con el comando, desde la carpeta raíz (misma carpeta donde está el requirements.txt)
   `pip install -r requirements.txt`
6. Instalar las dependencias de nodejs
   1. ir a src/backend
   2. ejecutar el comando `npm install`
7. Ejecutar los archivos init:
   - Si está en un entorno windows, ejecutar el archivo init.bat dandole click o desde la terminal:
     `./init.bat`
   - Si está en un entorno linux, o está utilizando WSL (https://ubuntu.com/wsl) ejecute el archivo init.sh:
     `./init.sh`
   - El archivo init ejecuta el comando `npm run dev` y `py manage.py runserver` de forma simultanea, lo cuál facilita el desarrollo y es ideal utilizarlo cada vez que mantenga el proyecto

## Opcional

- **Seed**: El comando `py manage.py seed` carga la base de datos con información de prueba, ideal para el desarrollo.
- **Build**: El comando `npm run build` es utilizado para generar archivos de javascript y css optimizados y minificados, destinados a producción.

## Documentación adicional

- **Django**: https://www.djangoproject.com/
- **Django secret**: https://docs.djangoproject.com/en/4.1/ref/settings/#secret-key
- **Sass**: https://sass-lang.com/documentation/
- **Datatables**: https://datatables.net/
- **Docker**: https://docs.docker.com/get-started/

