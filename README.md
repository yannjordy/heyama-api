# Heyama API

API REST NestJS pour la gestion d'objets avec Socket.IO.

## Installation locale

```bash
pnpm install
cp .env.example .env  # Configure tes variables
pnpm build
pnpm start
```

## Déploiement

### Railway
1. Connecte ton repo GitHub
2. Railway détecte automatiquement le Dockerfile
3. Ajoute les variables d'environnement depuis `.env.example`

### Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `MONGODB_URI` | URI de connexion MongoDB Atlas | `mongodb+srv://...` |
| `S3_USE_LOCAL` | Stockage local (true/false) | `false` en prod |
| `S3_BUCKET` | Nom du bucket S3 | `heyama-bucket` |
| `S3_ENDPOINT` | Endpoint S3 (Cloudflare R2) | `https://xxx.r2...` |
| `S3_ACCESS_KEY` | Clé d'accès S3 | — |
| `S3_SECRET_KEY` | Clé secrète S3 | — |

## Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /objects | Créer un objet (FormData: title, description, image) |
| GET | /objects | Lister tous les objets |
| GET | /objects/:id | Détail d'un objet |
| DELETE | /objects/:id | Supprimer un objet |

## Stack

- NestJS
- Socket.IO
- S3-compatible storage (Cloudflare R2)
- Stockage local pour le dev