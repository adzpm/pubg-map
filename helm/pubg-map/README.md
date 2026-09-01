# pubg-map

Helm chart for [pubg-map](https://github.com/adzpm/pubg-map) — interactive PUBG maps,
a static Vue 3 + Leaflet SPA (with its full webp tile pyramid baked into the image)
served by `nginx-unprivileged` on port 8080.

The deployment is hardened by default: non-root (uid 101), read-only root filesystem
(with an emptyDir at `/tmp` for nginx pid/temp files), no capabilities, seccomp
`RuntimeDefault`, and liveness/readiness probes against `/healthz`.

## Quickstart

```sh
helm install pubg-map ./helm/pubg-map
kubectl port-forward svc/pubg-map 8080:80
# open http://127.0.0.1:8080
```

With an ingress:

```sh
helm install pubg-map ./helm/pubg-map \
  --set ingress.enabled=true \
  --set ingress.className=nginx \
  --set 'ingress.hosts[0].host=pubg-map.example.com' \
  --set 'ingress.hosts[0].paths[0].path=/' \
  --set 'ingress.hosts[0].paths[0].pathType=Prefix'
```

## Important values

| Key | Default | Description |
| --- | --- | --- |
| `replicaCount` | `1` | Replicas; ignored when autoscaling is enabled |
| `image.repository` | `ghcr.io/adzpm/pubg-map` | Image repository |
| `image.tag` | `""` | Image tag; defaults to the chart `appVersion` |
| `service.type` | `ClusterIP` | Service type |
| `service.port` | `80` | Service port (container listens on 8080) |
| `ingress.enabled` | `false` | Expose via Ingress |
| `ingress.hosts` | `pubg-map.local` | Ingress host rules |
| `resources` | `10m/32Mi` req, `128Mi` limit | No cpu limit on purpose (avoids throttling) |
| `autoscaling.enabled` | `false` | HPA (1–3 replicas at 80% cpu) |
| `podDisruptionBudget.enabled` | `false` | PDB with `minAvailable: 1` |

See `values.yaml` for the full documented surface; values are validated by
`values.schema.json`.
