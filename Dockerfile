FROM node:18.16.0

WORKDIR /app

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . .

CMD ["npm", "run", "start:dev"]
