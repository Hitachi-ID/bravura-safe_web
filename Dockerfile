FROM bravura_vault/server

LABEL com.hitachi.product="bravura_vault"

ENV GOSU_VERSION 1.14
RUN set -eux; \
        \
        apk add --no-cache --virtual .gosu-deps \
                ca-certificates \
                dpkg \
                gnupg \
                wget \
        ; \
        \
        dpkgArch="$(dpkg --print-architecture | awk -F- '{ print $NF }')"; \
        wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch"; \
        wget -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch.asc"; \
        \
# verify the signature
        export GNUPGHOME="$(mktemp -d)"; \
        if [ -n "${http_proxy+set}" ]; then \
            gpg --batch --keyserver hkps://keys.openpgp.org --keyserver-options "http-proxy=$http_proxy" --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4; \
        else \
            gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4; \
        fi; \
        gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu; \
        command -v gpgconf && gpgconf --kill all || :; \
        rm -rf "$GNUPGHOME" /usr/local/bin/gosu.asc; \
        \
# clean up fetch dependencies
        apk del --no-network .gosu-deps; \
        \
        chmod +x /usr/local/bin/gosu; \
# verify that the binary works
        gosu --version; \
        gosu nobody true; \
# add packages for alpine container
        apk add --upgrade --no-cache \
                linux-pam \
                shadow \
                tzdata

ENV ASPNETCORE_URLS http://+:5000
WORKDIR /app
EXPOSE 5000
COPY ./build .
COPY entrypoint.sh /
RUN chmod +x /entrypoint.sh

HEALTHCHECK --interval=1m --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:5000 || exit 1

ENTRYPOINT ["sh", "/entrypoint.sh"]
