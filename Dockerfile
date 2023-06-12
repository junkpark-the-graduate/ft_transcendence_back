FROM node:18.16.0

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 3001

VOLUME [ "/app/node_modules" ]

RUN ["npx", "prisma", "generate"]

# CMD ["sh", "docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]
