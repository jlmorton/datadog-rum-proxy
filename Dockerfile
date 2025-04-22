# proxy/Dockerfile
FROM node:18-slim

WORKDIR /app

# copy only package.json
COPY package.json ./

# install production deps
RUN npm install --omit=dev

# copy the rest of your code
COPY . .

EXPOSE 3000
CMD ["node", "app.js"]

