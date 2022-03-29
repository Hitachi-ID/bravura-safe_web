#!/usr/bin/env bash
. ~/.nvm/nvm.sh

set -e

VERSION="0.1"
echo ""

if [ $# -eq 1 -a "$1" == "help" ]
then
    echo "Version $VERSION"
    echo "Usage: testbuild.sh [command]"
    echo "Without any parameters will call the build steps and generate a docker image."
    echo "========================"
    echo "install     Install the required version of node"
    echo ""

elif [ $# -eq 1 -a "$1" == "install" ]
then
    echo "Install node dependencies:"
    nvm install;
else
    echo "Run build for open source, selfhosted, production level:"
    nvm use
    npm install
    npm run build:oss:selfhost:prod
    docker build -t bravura_vault/web . --label com.hitachi.web.hash="$(git rev-parse HEAD)"
fi
