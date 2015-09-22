#!/bin/sh
echo "Deploying source to colori.timrourke.com."
rsync -zvr -e "ssh -p 534 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --exclude=.git --exclude=svg-source --exclude=scss --exclude=node_modules --exclude=images-source --exclude=bower_components --exclude=_Assets --progress . colori@timrourke.com:/var/www/colori