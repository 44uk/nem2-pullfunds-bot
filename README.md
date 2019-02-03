# NEM2 pullfunds bot

## Running

```console
$ PRIVATE_KEY=__PRIVATE_KEY__ URL=http://localhost:3000 npm start
```

## Using with catapult-service-bootstrap

Build image.

```console
$ docker build -t nem2-pullfunds-bot .
```

Add as a service.

```yaml:docker-compose.yml
bot:
  image: nem2-pullfunds-bot
  stop_signal: SIGINT
  environment:
    - PRIVATE_KEY=__PRIVATE_KEY__
    - URL=http://rest-gateway:3000
  depends_on:
    - rest-gateway
```
