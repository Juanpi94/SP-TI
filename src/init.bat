call ..\venv\Scripts\activate.bat

start "python server" /b py manage.py runserver
start "start web bundler" /b npm --prefix ./backend run build