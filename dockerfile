# node alpine 18
FROM node:18-alpine

# Cria um diretório de trabalho
WORKDIR /usr/src/app

# Copia o package.json para o diretório de trabalho
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o código fonte para o diretório de trabalho
COPY . .

# começa o servidor
CMD [ "npm", "start" ]