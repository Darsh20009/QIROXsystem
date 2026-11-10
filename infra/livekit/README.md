# QMeet self-hosted media server

This is the deployment path for running the QMeet SFU under our control
instead of using LiveKit Cloud.

The QMeet web/API application can remain on Render. LiveKit should run on a
separate VPS with a public IPv4 address because WebRTC needs a large UDP media
range. Do not try to run this as a normal HTTP-only web service.

## 1. Create the VPS

Create an Ubuntu 22.04/24.04 VPS with:

- a public IPv4 address;
- a compute-optimized CPU;
- enough network bandwidth for the expected concurrent rooms;
- a hostname such as `media.qiroxstudio.online`.

Add an `A` record for `media.qiroxstudio.online` pointing to the VPS. Keep
the DNS proxy disabled while first testing WebRTC so UDP reaches the VPS
directly.

## 2. Open the media ports

On the VPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 7880/tcp
sudo ufw allow 7881/tcp
sudo ufw allow 443/udp
sudo ufw allow 50000:60000/udp
sudo ufw --force enable
```

The provider firewall must allow the same ports. The UDP range is required
for camera and microphone traffic; opening only the HTTP port is not enough.

## 3. Install Docker and start Redis

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
newgrp docker

sudo mkdir -p /opt/livekit
docker run -d \
  --name qmeet-redis \
  --restart unless-stopped \
  --network host \
  redis:7-alpine \
  redis-server --bind 127.0.0.1 --protected-mode yes
```

## 4. Create the LiveKit configuration

Copy `livekit.yaml.example` to the VPS:

```bash
sudo nano /opt/livekit/livekit.yaml
```

Generate a new API key and secret on the VPS, then replace the two
placeholders under `keys:`:

```bash
openssl rand -hex 16
openssl rand -hex 32
```

The values are credentials. Keep them on the VPS and in Replit Secrets only;
never paste them into chat or commit them to Git.

## 5. Run LiveKit with host networking

Host networking avoids an extra NAT layer for WebRTC media:

```bash
docker run -d \
  --name qmeet-livekit \
  --restart unless-stopped \
  --network host \
  -v /opt/livekit/livekit.yaml:/etc/livekit.yaml:ro \
  livekit/livekit-server:latest \
  --config /etc/livekit.yaml
```

Check the service:

```bash
docker logs --tail 100 qmeet-livekit
curl -fsS http://127.0.0.1:7880/
```

## 6. Add HTTPS/WSS for signaling

The browser will not connect from an HTTPS QMeet site to an insecure
`ws://` endpoint. Use Caddy or another TLS reverse proxy for
`media.qiroxstudio.online`:

```text
media.qiroxstudio.online {
    reverse_proxy 127.0.0.1:7880
}
```

Caddy must be able to receive TCP/80 and TCP/443 so it can issue and renew
the certificate. LiveKit media UDP ports remain direct to the VPS.

## 7. Add the QMeet secrets to Render

In the Render environment for the QMeet API, add:

```text
LIVEKIT_URL=wss://media.qiroxstudio.online
LIVEKIT_API_KEY=<the key from the VPS>
LIVEKIT_API_SECRET=<the secret from the VPS>
```

Use Render's secret/environment-variable UI. Do not put these values in
`render.yaml`, Git, or chat. Restart/redeploy the QMeet service after adding
them because the server reads them at startup.

The existing QMeet endpoint will then report `mode: "sfu"` and allow up to
100 participants. A 50-person target still needs a real load test before
production use; the first test sequence should be 3, 10, 25, then 50
participants across desktop, Android, iOS, and restrictive networks.

## Operational notes

- One SFU node can serve a room of 50, but CPU, egress bandwidth, and the
  number of concurrent rooms determine the real capacity.
- Redis is local for the first node and is ready for multi-node coordination.
- Add a second SFU node and a layer-4 load balancer before claiming
  high-availability across node failures.
- Store recordings in object storage rather than the VPS disk.
- Keep QMeet's JWT endpoint as the only place that signs room tokens; do not
  expose the LiveKit API secret to the browser.