FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install
RUN npm run build

COPY . .

EXPOSE 8080

CMD [ "npm run dev"]