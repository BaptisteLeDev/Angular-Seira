# MontoMaster

Plateforme pédagogique (Monto V2) permettant aux écoles de gérer leurs classes, matières, chapitres et vidéos de formation, avec suivi de progression des élèves. Le monorepo regroupe trois applications : un backend Laravel, un front web Angular et une application mobile Expo.

## Architecture

```
MontoMaster/
├── backend/    # API Laravel 12 + API Platform + Sanctum
├── frontend/   # App web Angular 21
├── mobile/     # App mobile Expo (React Native)
├── docker/     # Dockerfile PHP + conf nginx/opcache
├── docs/       # Documentation projet
└── docker-compose.yml
```

Stack haut niveau :
- **Backend** : PHP 8 / Laravel 12, API Platform (OpenAPI auto), Sanctum (auth token), MariaDB 11, Redis 7.
- **Frontend** : Angular 21 (CLI, Vitest), déploiement Vercel.
- **Mobile** : Expo / React Native, file-based routing, builds Android & iOS.
- **Infra dev** : Docker Compose (nginx, php-fpm, MariaDB, Redis, phpMyAdmin).

## Backend — `backend/`

API REST Laravel exposée via API Platform à `http://localhost:8080/api`, documentée à `/api/docs`.

Domaine métier (voir [`SCHEMA_BDD.md`](./SCHEMA_BDD.md)) :
- `School` → `Classroom` → `User` (rôles `admin` / `teacher` / `student`).
- `Subject` (1 formateur principal) ↔ `Classroom` via `ClassroomSubject` (partage multi-classes).
- `Chapter` regroupe des `Video`, suivies par `VideoProgress` (statut, secondes validées, %).
- Soft deletes sur les entités métier principales.

Lancement (depuis la racine) :

```bash
docker compose up -d --build
docker compose exec php composer install
docker compose exec php php artisan key:generate
docker compose exec php php artisan migrate --force
docker compose exec php php artisan db:seed --force
```

Comptes seed : `admin@monto.test / Admin123!`, `prof@monto.test / Prof123!`, `eleve@monto.test / Eleve123!`.
phpMyAdmin disponible sur `http://localhost:8081`.

Détails complets : [`backend/README.md`](./backend/README.md).

## Frontend Angular — `frontend/`

App web Angular 21 (pnpm). Fournit les espaces admin, formateur et élève : gestion des écoles, classes, étudiants, matières, articles, lecture de vidéos avec suivi de progression et lecteur PDF intégré.

```bash
cd frontend
pnpm install
pnpm start            # ng serve → http://localhost:4200
pnpm test             # Vitest
pnpm build
```

Déploiement : `vercel.json` configuré (preview/prod via Vercel). Voir [`frontend/README.md`](./frontend/README.md).

## Mobile Expo — `mobile/`

App mobile React Native via Expo, avec file-based routing (`app/`). Cible Android, iOS et web. Consomme la même API Laravel que le front web.

```bash
cd mobile
pnpm install
npx expo start        # ouvre Expo Dev Tools
```

Builds natifs disponibles dans `android/` et `ios/`. Détails : [`mobile/README.md`](./mobile/README.md).

## Documentation

- [`SCHEMA_BDD.md`](./SCHEMA_BDD.md) — schéma de classes BDD (source de vérité des migrations).
- [`Migration.drawio.png`](./Migration.drawio.png) — brouillon d'architecture.
- [`docs/`](./docs) — documentation projet additionnelle.
