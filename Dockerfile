FROM node:12

WORKDIR /microbundle

ADD package.json .
RUN npm install

VOLUME test/__snapshots__
ADD . .
