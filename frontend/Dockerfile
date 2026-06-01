# Stage 1: Build React Application
FROM node:22-alpine AS build

WORKDIR /workspace

COPY package*.json ./
RUN npm install --no-audit

COPY . .
RUN npm run build

# Stage 2: Serve Static Assets using Nginx
FROM nginx:1.25-alpine

COPY --from=build /workspace/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
