#!/bin/bash

source ../venv/Scripts/activate

py manage.py runserver & npm --prefix ./backend run build
