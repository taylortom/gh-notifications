FROM node:24-alpine
WORKDIR /app
COPY package.json ./
COPY bin/ bin/
COPY lib/ lib/
EXPOSE 3000
CMD ["node", "bin/start.js"]
