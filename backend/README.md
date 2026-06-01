# Monto V2 Backend

Backend Laravel 12 + API Platform + Sanctum, lance via Docker Compose.

## Prerequis

- Docker Desktop
- Git

## Installation (nouvel arrivant equipe)

Depuis la racine du projet (dossier parent de `backend`):

```bash
docker compose up -d --build
docker compose exec php composer install
docker compose exec php php artisan key:generate
docker compose exec php php artisan migrate --force
docker compose exec php php artisan db:seed --force
```

## URLs utiles

- API docs: `http://localhost:8080/api/docs`
- API root (JSON-LD): `http://localhost:8080/api`
- phpMyAdmin: `http://localhost:8081`

## Comptes de test (seed)

- admin@monto.test / Admin123!
- prof@monto.test / Prof123!
- eleve@monto.test / Eleve123!

## Test manuel rapide (Swagger)

1. `POST /api/auth/login` avec le compte admin.
2. Copier `token` depuis la reponse.
3. Cliquer `Authorize` et coller `Bearer <token>`.
4. Tester `GET /api/auth/me`.
5. Tester `GET /api/users` (admin: 200, eleve/prof: 403).

## Commandes utiles

```bash
docker compose exec php php artisan test
docker compose exec php php artisan migrate:status
docker compose exec php composer dump-autoload
docker compose exec php php artisan optimize:clear
```

## Depannage

- Si une classe supprimée semble encore chargee (`include ... Failed to open stream`):

```bash
docker compose exec php composer dump-autoload
docker compose exec php php artisan optimize:clear
docker compose up -d --force-recreate --no-deps php nginx
```

- Si `Authorize` est vide dans `/api/docs`:
	- verifier la config `config/api-platform.php`
	- vider le cache config:

```bash
docker compose exec php php artisan optimize:clear
docker compose exec php php artisan config:cache
```
