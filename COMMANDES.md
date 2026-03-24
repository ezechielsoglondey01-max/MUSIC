## 1) Créer un network dédié + un volume MongoDB

```powershell
docker network create music-net
docker volume create music-mongo-data
```

```powershell
docker network ls
docker volume ls
```

## 2) Démarrer MongoDB

On lance MongoDB sur le network dédié, avec un volume pour persister les données.

```powershell
docker run -d `
  --name music-mongo `
  --network music-net `
  -v music-mongo-data:/data/db `
  -e MONGO_INITDB_DATABASE=music `
  mongo:7
```

```powershell
docker logs music-mongo
```

## 3) Builder l’image de l’application

```powershell
docker build -t music-app:1.0 .
```

## 4) Démarrer l’application

L’app se connecte à Mongo via le nom du conteneur `music-mongo` (résolu sur le network `music-net`).

```powershell
docker run -d `
  --name music-app `
  --network music-net `
  -p 8080:8080 `
  -e PORT=8080 `
  -e MONGO_URI=mongodb://music-mongo:27017/music `
  -e SYNC_ON_START=true `
  music-app:1.0
```

Ouvrir :

- Web UI: `http://localhost:8080`
- Health: `http://localhost:8080/healthz`
- API: `http://localhost:8080/api/tracks`

## 5) Déclencher une synchronisation manuelle (optionnel)

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8080/admin/sync
```

### Avec token

1) Démarre l’app avec `-e ADMIN_TOKEN=mon-secret`
2) Puis :

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8080/admin/sync -Headers @{ "x-admin-token" = "mon-secret" }
```

## 6) Arrêter / supprimer

Arrêter :

```powershell
docker stop music-app
docker stop music-mongo
```

Supprimer conteneurs :

```powershell
docker rm music-app
docker rm music-mongo
```

Supprimer volume :

```powershell
docker volume rm music-mongo-data
```

Supprimer network :

```powershell
docker network rm music-net
```

