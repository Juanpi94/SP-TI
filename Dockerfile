FROM python:3.9

RUN mkdir ATIC

WORKDIR /ATIC
COPY . .

RUN pip install --upgrade pip

RUN pip install -r requirements.txt

RUN apt-get update && apt-get install -y curl sudo

RUN set -uex; \
    apt-get update; \
    apt-get install -y ca-certificates curl gnupg; \
    mkdir -p /etc/apt/keyrings; \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
     | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg; \
    NODE_MAJOR=20; \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" \
     > /etc/apt/sources.list.d/nodesource.list; \
    apt-get -qy update; \
    apt-get -qy install nodejs;

RUN echo "NODEJS VERSION: " && node --version
RUN echo "NPM VERSION: " && npm --version

RUN npm install -y

RUN npm run build;

RUN python3 src/manage.py collectstatic --no-input

RUN rm -r ./src/backend/static/assets
RUN rm -r ./source

CMD ["gunicorn", "-c", "/ATIC/config/gunicorn/conf.py", "--bind", ":8000", "--chdir", "src", "atic.wsgi:application"]

# CMD ["python3", "src/manage.py", "runserver"]
