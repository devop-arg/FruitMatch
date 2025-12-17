FROM node:20-alpine

WORKDIR /app

# Copiar package.json primero para cachear dependencias
COPY package.json ./

# Instalar solo dependencias de produccion
RUN npm install --production && npm cache clean --force

# Copiar codigo
COPY server.js ./

# Crear directorio de datos
RUN mkdir -p /app/data

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 3777

# Limitar memoria de Node.js a 32MB
ENV NODE_OPTIONS="--max-old-space-size=32"

CMD ["node", "server.js"]
