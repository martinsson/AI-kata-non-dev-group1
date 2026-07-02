# Serves the static site in ./site on Railway.
# nginx:alpine runs envsubst over files in /etc/nginx/templates/ at startup,
# substituting only variables that are set in the environment (Railway sets $PORT),
# so $PORT is replaced while nginx's own $uri/$host are left untouched.
FROM nginx:alpine

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY site/ /usr/share/nginx/html/
