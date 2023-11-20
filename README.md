# ATIC: Herramienta para la gestión de activos de la UCR

## Requisitos

- Tener instalado Python3 https://www.python.org/downloads/
- Tener instalado Node JS https://nodejs.org/es/
- De forma preferible contar con el editor de código PyCharm Professional https://www.jetbrains.com/es-es/pycharm/

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
6. Instalar las dependencias de nodejs (misma carpeta donde está el package.json)
   1.Ejecutar `npm i` en la raíz del proyecto


# Mantener El proyecto
El proyecto utiliza django para correr el servidor web y el backend, y webpack para compilar el javascript.

## Comando para ejecutar el backend
```bash
py src/manage.py runserver
```
## Comando para ejecutar webpack
```
npm run build
# O si quiere que webpack compile mientras trabaja
npm run watch
```

# Opcional

- **Seed**: El comando `py manage.py seed` carga la base de datos con información de prueba, ideal para el desarrollo.
- **Build**: El comando `npm run build` es utilizado para generar archivos de javascript y css optimizados y minificados, destinados a producción.

## Troubleshooting
- Los archivos javascript que genera webpack terminan en .bundle.js, tenga eso en cuenta a la hora de añadirlos al html
- Todos los estilos están en main.css, por lo que al añadir nuevos estilos no es necesario que los agregue al html
- En el la carpeta `source/js` los archivos javascript que comiencen con underscore `_` son ignorados y no se compilan.

## Documentación adicional

- **Django**: https://www.djangoproject.com/
- **Django secret**: https://docs.djangoproject.com/en/4.1/ref/settings/#secret-key
- **Django Rest Framework**: https://www.django-rest-framework.org/
- **Sass**: https://sass-lang.com/documentation/
- **Tabulator**: https://tabulator.info/
- **Webpack**: https://webpack.js.org/
- **Docker**: https://docs.docker.com/get-started/

