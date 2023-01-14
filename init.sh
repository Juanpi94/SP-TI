#!/bin/bash

source ./venv/Scripts/activate

py src/manage.py runserver & npm --prefix ./src/backend run dev
