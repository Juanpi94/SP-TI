FROM python:3.8

WORKDIR /
COPY . .

RUN pip install --upgrade pip

RUN pip install -r requirements.txt

RUN apt-get update && apt-get install -y curl sudo

RUN curl -fsSL https://deb.nodesource.com/setup_19.x | sudo -E bash -

RUN sudo apt-get install -y nodejs

RUN echo "NODEJS VERSION: " && node --version
RUN echo "NPM VERSION: " && npm --version

WORKDIR /src/backend

RUN npm install -y

RUN npm run build;

WORKDIR /

RUN python3 src/manage.py collectstatic

RUN rm -r ./src/backend/static/dist
RUN rm -r ./src/backend/static/assets

CMD ["gunicorn", "-c", "config/gunicorn/conf.py", "--bind", ":8000", "--chdir", "src", "atic.wsgi:application"]

# CMD ["python3", "src/manage.py", "runserver"]
