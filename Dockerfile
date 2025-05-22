# Usa imagem oficial Puppeteer com Chromium embutido
FROM ghcr.io/puppeteer/puppeteer:latest

# Usa usuário root para evitar problemas de permissão
USER root

# Cria diretório de trabalho
WORKDIR /app

# Copia arquivos e instala dependências sem gerar package-lock.json
COPY package*.json ./
RUN npm install --no-save

COPY . .

# Porta opcional
EXPOSE 3000

# Comando principal
CMD ["node", "index.js"]
