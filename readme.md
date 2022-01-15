POC of electron webrtc streaming, which needs

1. a turn server like `coturn`
```
# example /etc/turnserver.conf
listening-port=3478
user=abc:abc
lt-cred-mech
```

2. docker image with elctron
```bash
docker build . -t nvidia-electron
```
