call .\venv\Scripts\activate.bat

start "python server" /b py ./src/manage.py runserver
start "start web bundler" /b npm --prefix ./src/backend run dev