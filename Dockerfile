# Serve the static site/ folder on Railway.
# The "Gestion locative" app is plain HTML/CSS/JS (state in localStorage),
# so we just need a static file server bound to Railway's $PORT.
FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY site/ /srv/

# Caddy's default entrypoint runs the Caddyfile above.
