# Bhutan Crop Monitoring

[![Python: 3.9](https://img.shields.io/badge/python-3.9-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![SERVIR: Global](https://img.shields.io/badge/SERVIR-Global-green)](https://servirglobal.net)

This Crop Monitoring platform harnesses the power of cutting-edge technology to empower decision-makers and farmers 
alike in tackling the pressing challenges of food security.  This can easily be expanded to additional regions assuming 
the data is available.

## Setup and Installation
The installation described here will make use of conda to ensure there are no package conflicts with
existing or future applications on the machine.  It is highly recommended using a dedicated environment
for this application to avoid any issues.

### Recommended
Conda (To manage packages within the applications own environment)

### Environment
- Create the env

```commandline
conda env create -f environment.yml
```

Add a file named data.json in the base directory.  This file will hold a json object containing
the siteID for your application, ALLOWED_HOSTS, and CSRF_TRUSTED_ORIGINS.  The format will be:

```json
{
  "siteID": 3,
  "ALLOWED_HOSTS": ["localhost", "your_domain.com", "127.0.0.1"],
  "CSRF_TRUSTED_ORIGINS": ["https://your_domain.com"],
  "SECRET_KEY": "REPLACE WITH A SECRET KEY USING LETTERS, NUMBERS, AND SPECIAL CHARACTERS"
}
```

- enter the environment

```shell
conda activate bhutan_crop_monitoring
```

- Create database tables and superuser
###### follow prompts to create super user
```shell
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic
```

At this point you should be able to start the application.  From the root directory you can run the following command

```
python manage.py runserver
```

Of course running the application in this manner is only for development.  We recommend installing
this application on a server and serving it through nginx using gunicorn (conda install gunicorn) for production.  To do this you will need to
have both installed on your server.  There are enough resources explaining in depth how to install them,
so we will avoid duplicating this information.  We recommend adding a service to start the application
by creating a .service file located at /etc/systemd/system.  We named ours crop_monitor.service
The service file will contain the following, please substitute the correct paths as mentioned below.
 

# Server installation
## Create Application Service
As mentioned above create the following file at /etc/systemd/system and name it crop_monitor.service
```editorconfig
[Unit]
Description=crop_monitor daemon
After=network.target

[Service]
User=nginx
Group=nginx
SocketUser=nginx
WorkingDirectory={REPLACE WITH PATH TO APPLICATION ROOT}/bhutan_crop_monitoring
accesslog = "/var/log/crop_monitor/crop_monitor_gunicorn.log"
errorlog = "/var/log/crop_monitor/crop_monitor_gunicornerror.log"
ExecStart={REPLACE WITH FULL PATH TO gunicorn IN YOUR CONDA ENV}/bin/gunicorn --timeout 60 --workers 5 --pythonpath '{REPLACE WITH PATH TO APPLICATION ROOT},{REPLACE WITH FULL PATH TO YOUR CONDA ENV}/lib/python3.10/site-packages' --bind unix:{REPLACE WITH LOCATION YOU WANT THE SOCK}/crop_monitor_prod.sock wsgi:application

[Install]
WantedBy=multi-user.target

```
Now enable the service
```shell
sudo systemctl enable crop_monitor
```


## Create nginx site
Create a file in /etc/nginx/conf.d named crop_monitor_prod.conf

```editorconfig
upstream crop_monitor_prod {
  server unix:{REPLACE WITH LOCATION YOU WANT THE SOCK}/crop_monitor_prod.sock 
  fail_timeout=0;
}

server {
    listen 443;
    server_name {REPLACE WITH YOUR DOMAIN};
    add_header Access-Control-Allow-Origin *;

    ssl on;
    ssl_certificate {REPLACE WITH FULL PATH TO CERT FILE};
    ssl_certificate_key {REPLACE WITH FULL PATH TO CERT KEY};

    # Some Settings that worked along the way
    client_max_body_size 8000M;
    client_body_buffer_size 8000M;
    client_body_timeout 120;

    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    fastcgi_buffers 8 16k;
    fastcgi_buffer_size 32k;
    fastcgi_connect_timeout 90s;
    fastcgi_send_timeout 90s;
    fastcgi_read_timeout 90s;


    location = /favicon.ico { access_log off; log_not_found off; }
    location /static/ {
        autoindex on;
        alias {REPLACE WITH FULL PATH TO APPS}/staticfiles/;
    }

    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://unix:{REPLACE WITH LOCATION YOU WANT THE SOCK}/crop_monitor_prod.sock ;
    }


}

# Reroute any non https traffic to https
server {
    listen 80;
    server_name {REPLACE WITH YOUR DOMAIN};
    rewrite ^(.*) https://$server_name$1 permanent;
}

```

# Create Alias commands to make starting the application simple
Create a file at /etc/profile.d named crop_monitor_alias.sh and add the following:
```commandline
# Global Alias
alias d='conda deactivate'
alias so='sudo chown -R www-data /servir_apps'
alias nsr='sudo service nginx restart'
alias nss='sudo service nginx stop'


# crop_monitor Alias
alias crops='cd /servir_apps/bhutan_crop_monitoring'
alias actcrops='conda activate bhutan_crop_monitoring'
alias uocrops='sudo chown -R ${USER} /servir_apps/bhutan_crop_monitoring'
alias socrops='sudo chown -R www-data /servir_apps/bhutan_crop_monitoring'
alias cropsstart='sudo service crop_monitor restart; sudo service nginx restart; so'
alias cropsstop='sudo service crop_monitor stop'
alias cropsrestart='cropsstop; cropsstart'

```
Now activate the alias file by running
```commandline
source /etc/profile.d/crop_monitor_alias_alias.sh
```

### Contact

Please feel free to contact us if you have any questions.

### Authors

- [Billy Ashmall (NASA/USRA)](https://github.com/billyz313)

## License and Distribution

This application is built and maintained by SERVIR under the terms of the MIT License. See
[LICENSE](https://github.com/SERVIR/AppTemplate2022/blob/master/license) for more information.

## Privacy & Terms of Use

This applications abides to all of SERVIR's privacy and terms of use as described
at [https://servirglobal.net/Privacy-Terms-of-Use](https://servirglobal.net/Privacy-Terms-of-Use).

## Disclaimer

The SERVIR Program, NASA and USAID make no express or implied warranty of this application as to the merchantability or
fitness for a particular purpose. Neither the US Government nor its contractors shall be liable for special,
consequential or incidental damages attributed to this application.