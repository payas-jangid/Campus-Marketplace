FROM node:20-slim

# prisma-> openSSl
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

RUN npm run build

EXPOSE 5000

CMD [ "npm","start" ]