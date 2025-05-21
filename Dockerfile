# Usa imagem oficial Puppeteer com Chromium embutido
FROM ghcr.io/puppeteer/puppeteer:latest

# Cria diretório de trabalho
WORKDIR /app

# Copia arquivos e instala dependências
COPY package*.json ./
RUN npm install

COPY . .

# Porta opcional
EXPOSE 3000

# Comando principal
CMD ["node", "index.js"]
