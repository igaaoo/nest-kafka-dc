# Imagem base
FROM node

# Diretório de trabalho
WORKDIR /var/www/dc-microservice

# Copia arquivos de dependências
COPY package.json ./
COPY prisma ./prisma

# Instala dependências
RUN npm install
RUN npx prisma generate

# Copia o restante do código
COPY . .


# Variáveis de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build da aplicação
RUN npm run build

# Comando para iniciar
CMD ["npm", "run", "start"]