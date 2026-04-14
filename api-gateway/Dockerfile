# Imagem base
FROM node

# Diretório de trabalho
WORKDIR /var/www/api-gateway

# Copia arquivos de dependências
COPY package.json ./

# Instala dependências
RUN npm install

# Copia o restante do código
COPY . .

# Variáveis de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build da aplicação
RUN npm run build

EXPOSE 3000

# Comando para iniciar
CMD ["npm", "run", "start"]