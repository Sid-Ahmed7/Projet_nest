# Esport Tournament API

API NestJS de gestion de joueurs, jeux, tournois et matchs pour l'organisation de compétitions esport.

Toute la documentation et les tests de routes sont disponibles via Swagger.

## 1. Prerequis

- Docker Desktop
- Node.js (LTS)
- npm

```bash
npm install
```

## 2. Fichiers d environnement

Creer les fichiers suivants a la racine du projet pour configurer les differents environnements.

### .env.development.local (DEV)
Utilise par `docker-compose.dev.yml`.

```env
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=K8b6N8L2mu
DB_NAME=video_games
DB_SYNCHRONIZE=true
NODE_ENV=development
PORT=3003
JWT_SECRET=secret_jwt
JWT_EXPIRES_IN=900
JWT_REFRESH_SECRET=secret_refresh
JWT_REFRESH_EXPIRES_IN=604800
ADMIN_USERNAME=admin
ADMIN_EMAIL=email_admin
ADMIN_PASSWORD=mot_de_passe_admin
```

### .env (PROD)
Utilise par `docker-compose.yml`. Contient les configurations pour l'environnement de production.

```env
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=mot_de_passe
DB_NAME=video_games
DB_SYNCHRONIZE=false
NODE_ENV=production
PORT=3000
JWT_SECRET=secret_jwt
JWT_EXPIRES_IN=900
JWT_REFRESH_SECRET=secret_refresh
JWT_REFRESH_EXPIRES_IN=604800
ADMIN_USERNAME=admin
ADMIN_EMAIL=email_admin
ADMIN_PASSWORD=mot_de_passe_admin
```

### .env.test (TEST)
Utilise pour les tests E2E.

```env
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD=K8b6N8L2mu
DB_NAME=video_games_test
DB_SYNCHRONIZE=true
NODE_ENV=test
PORT=3003
JWT_SECRET=secret_jwt
JWT_EXPIRES_IN=900
JWT_REFRESH_SECRET=secret_refresh
JWT_REFRESH_EXPIRES_IN=604800
ADMIN_USERNAME=admin_test
ADMIN_EMAIL=email_admin_test
ADMIN_PASSWORD=mot_de_passe_admin
```
Remplacer egalement :
- `ADMIN_EMAIL` par une adresse email administrateur (ex: `admin@gmail.com`)
- `ADMIN_PASSWORD` par un mot de passe (min. 8 caracteres, majuscules, chiffres et caracteres speciaux )


## 3. Generer les secrets

Pour les variables `JWT_SECRET`, `JWT_REFRESH_SECRET` :

```bash
openssl rand -hex 64
```

Remplacer les valeurs `secret_jwt` et `secret_refresh` dans `.env` et `.env.development.local` par les valeurs generees.

Remplacer egalement :
- `ADMIN_EMAIL` par une adresse email administrateur (ex: `admin@gmail.com`)
- `ADMIN_PASSWORD` par un mot de passe (min. 8 caracteres, majuscules, chiffres et caracteres speciaux )

## 4. Lancer le projet

### Developpement (Watch mode)

```bash
docker compose  -f docker-compose.dev.yml up --build
```

### Production

```bash
docker compose up --build -d
```

### Tests unitaires

```bash
npm test                 
npm run test:watch
```

### Tests E2E

```bash
npm run test:e2e
```

## 4. URLs utiles

- API (Dev): http://localhost:3003
- Swagger Docs: http://localhost:3003/api/docs
- WebSocket Gateway: ws://localhost:3003

## 5. Administration et Seeding

Le projet utilise un `SeederService` qui s'execute au demarrage de l'application :
- Un compte administrateur est cree automatiquement s'il n'existe pas dans la base de donnees.
- Les identifiants par defaut sont ceux renseignes dans vos variables d'environnement (`ADMIN_EMAIL` et `ADMIN_PASSWORD`).

Pour visualiser les logs :

```bash
# Developpement
docker compose -f docker-compose.dev.yml logs -f api

# Production
docker compose logs -f api
```