FROM node:16

WORKDIR /app

COPY . .

ENV NODE_ENV="production"

RUN yarn install

RUN yarn build

CMD [ "node", "." ]
