FROM node:18-alpine

WORKDIR /app

COPY services/inventory-service/package*.json ./

RUN npm install --production

COPY services/inventory-service/ .
COPY proto/ /proto/

EXPOSE 5005

CMD ["npm", "start"]
