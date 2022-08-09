# ATIC: Herramienta para la gestión de activos de la UCR

## Requisitos
* Tener instalado Python3 https://www.python.org/downloads/
* Tener instalado Node JS https://nodejs.org/es/
* De forma preferible contar con el editor de código VSCode

## Pasos para configurar el proyecto
1- Crear un archivo con el nombre .env, luego copiar y pegar el texto de .env.template a ese archivo
2- Colocar el secret en ese .env
3- instalar las dependencias de python con el comando, desde la carpeta raíz (misma carpeta donde está el requirements.txt)
´´pip install -r requirements.txt´´
4- Instalar las dependencias de nodejs
  1- ir a src/backend
  2- ejecutar el comando
  ´´npm install´´
5- Probar si la app funciona ejecutando uno de los archivos init
    * Si está en un entorno windows, ejecutar el archivo init.bat dandole click o desde la terminal:
     ´´./init.bat´´
     * Si está en un entorno linux, o está utilizando WSL (https://ubuntu.com/wsl) ejecute el archivo init.sh:
     ´´./init.sh´´
