FROM bravura_vault/server

LABEL com.hitachi.product="bravura_vault"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gosu \
        curl \
&& rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_URLS http://+:5000
WORKDIR /app
EXPOSE 5000
COPY ./build .
COPY entrypoint.sh /
RUN chmod +x /entrypoint.sh

HEALTHCHECK CMD curl -f http://localhost:5000 || exit 1

ENTRYPOINT ["/entrypoint.sh"]
