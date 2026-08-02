FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
# Ejecutar como usuario no privilegiado (no root) reduce el impacto de un
# compromiso del proceso (evita root dentro del contenedor).
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app
EXPOSE 8083
CMD ["node", "src/index.js"]
