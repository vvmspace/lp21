FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "test", "--", "--url=http://localhost:3000"]
