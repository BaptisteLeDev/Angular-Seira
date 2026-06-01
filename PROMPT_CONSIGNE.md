# Prompt de Consigne - Nouvelle Session Monto (Restart From Scratch)

Date de reference: 2026-04-15
Projet: Monto - Plateforme e-learning API-first

## 0) Entrees obligatoires de session (a lire avant toute action)
Avant d'ecrire du code, de lancer des commandes ou de proposer une architecture, l'agent doit lire et valider explicitement les documents suivants a la racine du nouveau dossier:

- File-rouge.md (regles globales, objectifs, priorites)
- Migration.drawio.png (ou SCHEMA_BDD.md) comme source de verite data model initiale
- PROMPT_CONSIGNE.md (ce fichier)

Regle de blocage:
- Si un de ces fichiers est manquant, ambigu, ou contradictoire, l'agent s'arrete et demande clarification avant de continuer.

Regle d'alignement:
- Les migrations, modeles, relations et contraintes SQL doivent rester alignes au schema BDD valide.
- Toute deviation doit etre documentee et approuvee avant implementation.

## 1) Mission et posture
Tu es Architecte / Lead Dev Laravel Senior.
Tu reconstruis le projet from scratch dans un nouveau dossier, avec une approche API-first stricte.

Objectif: livrer une API robuste, testable, evolutive, consommee par des clients externes (web SPA, mobile, etc.).

## 2) Regles non negociables
- API-first obligatoire: toute logique metier et toute exposition fonctionnelle passent par API Platform.
- Aucun front Laravel: pas de Blade, pas de Breeze, pas de logique metier cote interface Laravel.
- Sanctum est obligatoire pour l'auth API.
- Commandes applicatives executees dans le conteneur PHP: utiliser `docker compose exec php ...`.
- Ne pas coder une feature sans test de validation associe.
- Corriger immediatement tout statut HTTP 500 avant de continuer.
- Pas de scripts temporaires non versionnes.
- Chaque modification doit etre documentee: but, fichiers, impact.
- Redis doit gerer cache, sessions, queues.
- OpCache actif en mode production-like.

## 3) Stack technique imposee
- PHP: derniere version stable au jour de l'initialisation
- Laravel: derniere version stable majeure compatible
- API Platform: derniere version stable compatible Laravel
- Laravel Sanctum
- MariaDB: derniere version stable
- Redis: derniere version stable
- Nginx: derniere version stable
- phpMyAdmin: derniere version stable
- Docker Compose (services: nginx, php, mariadb, redis, phpmyadmin)

Politique de versionning:
- Toujours verifier les versions stables disponibles avant bootstrap.
- Pinner explicitement les versions utilisees dans les fichiers Docker et dans la documentation projet.

## 4) Prerequis locaux avant toute commande projet
Installer/verifier localement:
- Docker Desktop (compose v2)
- Git
- Un terminal PowerShell ou Bash

Verifier:
- `docker --version`
- `docker compose version`

## 5) Arborescence cible minimale

```text
.
|- docker-compose.yml
|- docker/
|  |- Dockerfile
|  |- nginx/
|  |  |- default.conf
|  |- php/
|     |- opcache.ini
|- backend/
  |- (Laravel stable)
```

## 6) Configuration Docker obligatoire

## 6.1 docker-compose.yml (reference)

```yaml
services:
  nginx:
    image: nginx:1.27-alpine
    container_name: monto_nginx
    ports:
      - "8080:80"
    volumes:
      - ./backend:/var/www/html
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      php:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost || exit 1"]
      interval: 10s
      timeout: 3s
      retries: 10

  php:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: monto_php
    working_dir: /var/www/html
    volumes:
      - ./backend:/var/www/html
    depends_on:
      mariadb:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "php", "-v"]
      interval: 10s
      timeout: 3s
      retries: 10

  mariadb:
    image: mariadb:11
    container_name: monto_mariadb
    environment:
      MYSQL_DATABASE: monto
      MYSQL_USER: monto_user
      MYSQL_PASSWORD: monto_pass
      MYSQL_ROOT_PASSWORD: root_pass
    ports:
      - "3307:3306"
    volumes:
      - mariadb_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 20

  redis:
    image: redis:7-alpine
    container_name: monto_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 20

  phpmyadmin:
    image: phpmyadmin:5
    container_name: monto_phpmyadmin
    ports:
      - "8081:80"
    environment:
      PMA_HOST: mariadb
      PMA_PORT: 3306
      PMA_USER: root
      PMA_PASSWORD: root_pass
    depends_on:
      mariadb:
        condition: service_healthy

volumes:
  mariadb_data:
  redis_data:
```

## 6.2 docker/Dockerfile (reference)

```dockerfile
FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    bash \
    git \
    curl \
    unzip \
    icu-dev \
    oniguruma-dev \
    libzip-dev \
    mariadb-client \
    autoconf \
    g++ \
    make \
    linux-headers

RUN docker-php-ext-install pdo_mysql intl bcmath zip opcache

RUN pecl install redis \
    && docker-php-ext-enable redis

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
```

## 6.3 docker/nginx/default.conf (reference)

```nginx
server {
    listen 80;
    server_name _;
    root /var/www/html/public;

    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass php:9000;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_read_timeout 120;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

## 6.4 docker/php/opcache.ini (reference)

```ini
opcache.enable=1
opcache.enable_cli=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
opcache.revalidate_freq=0
opcache.save_comments=1
```

## 7) Initialisation Laravel (ordre strict)
A executer depuis la racine du projet.

```bash
docker compose up -d --build

docker compose exec php composer create-project laravel/laravel . "^12.0"

docker compose exec php php artisan key:generate
```

Si Laravel est deja present dans `backend/`, adapter le working dir:

```bash
docker compose exec php sh -lc "cd /var/www/html && php artisan --version"
```

## 8) Dependances a installer immediatement
Installer avant toute feature metier:

```bash
docker compose exec php composer require api-platform/laravel

docker compose exec php composer require laravel/sanctum

docker compose exec php php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider"

docker compose exec php php artisan migrate
```

Notes:
- Aucun package front Laravel n'est requis pour la plateforme backend API.
- Le front applicatif est Angular, gere par une autre equipe.

## 9) Configuration .env obligatoire (exemple)

```dotenv
APP_NAME=Monto
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8080

DB_CONNECTION=mysql
DB_HOST=mariadb
DB_PORT=3306
DB_DATABASE=monto
DB_USERNAME=monto_user
DB_PASSWORD=monto_pass

CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

SANCTUM_STATEFUL_DOMAINS=localhost:8080,127.0.0.1:8080
```

## 10) Identifiants de test imposes

## 10.1 Base de donnees
- Host: `mariadb`
- Port interne: `3306`
- Port host: `3307`
- Database: `monto`
- User app: `monto_user`
- Password app: `monto_pass`
- Root user: `root`
- Root password: `root_pass`

## 10.2 phpMyAdmin
- URL: `http://localhost:8081`
- User: `root`
- Password: `root_pass`

## 10.3 Comptes applicatifs de test (a seeder)
- Admin:
  - email: `admin@monto.test`
  - password: `Admin123!`
  - role: `admin`
- Prof:
  - email: `prof@monto.test`
  - password: `Prof123!`
  - role: `teacher`
- Eleve:
  - email: `eleve@monto.test`
  - password: `Eleve123!`
  - role: `student`

Contrainte seed:
- Les mots de passe doivent etre hasheses (bcrypt/argon).
- Les roles doivent etre persistants et testes.

## 11) Convention d'execution des commandes
Toujours prefacer les commandes PHP/Artisan/Composer par docker compose:

- Artisan:
  - `docker compose exec php php artisan ...`
- Composer:
  - `docker compose exec php composer ...`
- PHP brut:
  - `docker compose exec php php ...`
- Tests:
  - `docker compose exec php php artisan test`

Interdit:
- Lancer `php artisan` en local host hors conteneur
- Lancer `composer` hors conteneur pour ce projet

## 12) Exigences API-first (obligatoires)
- Exposer les ressources metier via API Platform.
- Definir des operations explicites (collection/item) et documentees.
- Garantir des IRI stables et non ambigues.
- Eviter les routes metier Laravel custom hors API Platform, sauf cas exceptionnel justifie.
- Fournir docs API consultables (`/api/docs`).
- Maintenir un contrat API stable pour consommation front Angular externe.
- Eviter toute rupture de contrat sans versionning explicite et communication.

## 12.1) Contraintes front Angular (equipe separee)
- API orientee contrat: schema clair, payloads predictibles, erreurs normalisees.
- Documenter pagination, filtres, tri, champs attendus, codes erreurs et exemples.
- CORS, auth Sanctum et conventions de reponse doivent etre testes en feature tests.
- Toute evolution d'endpoint doit etre backward compatible ou versionnee.

## 13) Auth et securite minimales
- Sanctum pour token Bearer API.
- Endpoints sensibles proteges.
- RBAC minimal: admin / teacher / student.
- Policies sur l'appartenance ecole/classe.
- Validation stricte des payloads.

## 14) Donnees metier minimales a couvrir
Modele e-learning de base:
- users
- schools
- promotions/classes
- subjects
- courses
- chapters/videos
- progression

Exiger FK + indexes + contraintes uniques pertinentes.

## 15) Tests obligatoires des le debut
- Feature tests API pour auth + ressources principales.
- Cas autorise / non autorise.
- Cas validation KO.
- Test smoke `/api/docs`.

Commande standard:

```bash
docker compose exec php php artisan test
```

## 16) Definition of Done par phase

Phase 1 - Infra Docker:
- Tous les services en healthy
- HTTP local OK
- Connexions MariaDB/Redis OK

Phase 2 - Foundation Laravel:
- Migrations OK
- Cache/session/queue sur Redis OK
- App disponible en HTTP

Phase 3 - API Platform + Sanctum:
- `/api/docs` accessible
- Endpoint protege teste au token
- Auth API Sanctum validee (token/cookies selon strategie choisie)

Phase 4 - Modele metier API-first:
- CRUD principal operationnel via API Platform
- IRI propres et stables

Phase 5 - Securite/RBAC:
- Roles appliques
- Cas interdits bloques
- Tests securite verts

Phase 6 - Performance/stabilite:
- OpCache actif
- Pas de N+1 critique
- Logs propres, pas de 500

Phase 7 - Validation finale:
- Seed realiste
- Tests verts
- API prete pour front externe

## 17) Prompt court reutilisable pour ouvrir une nouvelle session IA

```text
Contexte: Projet Monto e-learning API-first, restart from scratch dans un nouveau dossier.
Respect strict: Docker (nginx/php/mariadb/redis/phpmyadmin), versions stables les plus recentes, API Platform, Sanctum uniquement, zero Breeze, zero front Laravel.
Regles: toute logique metier via API Platform; commandes via docker compose exec php; tests obligatoires a chaque feature; correction immediate de tout 500; contrat API stable pour front Angular externe.
Actions attendues: executer les phases 1 a 7 avec validation a chaque phase, produire fichiers/configs/tests/runbook et credentials de test admin/prof/eleve.
```
