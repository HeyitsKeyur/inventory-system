FROM node:18-alpine

WORKDIR /app

COPY services/notification-service/package*.json ./

RUN npm install --production

COPY services/notification-service/ .
COPY proto/ /proto/

EXPOSE 5002

CMD ["npm", "start"]
