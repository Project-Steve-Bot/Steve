FROM node:16

WORKDIR /app

COPY package.json .

RUN yarn install

COPY . .

ENV NODE_ENV="production"

RUN yarn build

CMD [ "node", "." ]
