FROM node:8-alpine
RUN apk update && apk upgrade && apk add --no-cache \
  make \
  g++ \
  python \
  nodejs
WORKDIR /app
COPY . .
RUN npm install
ENTRYPOINT ["npm"]
CMD ["start"]
