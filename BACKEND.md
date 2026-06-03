# Backend — Monto API

> Stack : **Laravel 12** · **API Platform 4.3** · **Sanctum** · **MySQL**
> Documentation mise à jour le **2026-06-02**

---

## Table des matières

1. [Architecture](#1-architecture)
6. [Vues agrégées](#6-vues-agrégées)
2. [Authentification & RBAC](#2-authentification--rbac)
3. [Modèles & relations](#3-modèles--relations)
4. [Endpoints API Platform](#4-endpoints-api-platform)
5. [Système anti-triche — Watch Sessions](#5-système-anti-triche--watch-sessions)
6. [State Processors & Providers](#6-state-processors--providers)
7. [Sécurité & règles métier](#7-sécurité--règles-métier)
8. [À faire (backend)](#8-à-faire-backend)

---

## 1. Architecture

```
backend/
├── app/
│   ├── Models/              # Modèles Eloquent + attributs API Platform
│   ├── ApiResource/         # DTOs (input/output)
│   ├── State/               # Processors & Providers par domaine
│   │   ├── Auth/
│   │   ├── Chapter/
│   │   ├── ChapterContent/
│   │   ├── ChapterProgress/
│   │   ├── Classroom/
│   │   ├── School/
│   │   ├── Subject/
│   │   ├── User/
│   │   ├── Video/
│   │   └── VideoProgress/
│   ├── Services/
│   │   └── WatchTokenService.php   # Anti-triche — tokens HMAC
│   ├── Http/Controllers/
│   │   └── WatchSessionController.php
│   └── Providers/
│       └── AppServiceProvider.php  # Toutes les Gates (RBAC)
├── routes/
│   ├── api.php              # Routes custom (watch sessions)
│   └── web.php
├── bootstrap/app.php
└── database/migrations/
```

**Principe :** API Platform génère automatiquement les routes REST à partir des attributs `#[ApiResource]` sur les modèles. Les opérations complexes passent par des Processors/Providers dédiés.

---

## 2. Authentification & RBAC

### Authentification (Sanctum)

| Endpoint | Méthode | Description |
|---|---|---|
| `/auth/login` | POST | Connexion → retourne un Bearer token |
| `/auth/logout` | POST | Révocation du token courant |
| `/auth/me` | GET | Infos de l'utilisateur connecté |

Toutes les routes protégées requièrent l'en-tête :
```
Authorization: Bearer <token>
```

### Rôles

| Rôle | Code | Périmètre |
|---|---|---|
| Administrateur | `admin` | Accès total (CRUD sur tout) |
| Formateur | `teacher` | Lecture de ses matières/classes/élèves |
| Élève | `student` | Lecture de ses cours, suivi de progression |

### Gates (AppServiceProvider)

Chaque ressource expose 5 gates : `list`, `view`, `create`, `update`, `delete`.

| Ressource | list | view | create/update/delete |
|---|---|---|---|
| users | admin | self ou admin | admin |
| schools | admin | admin | admin |
| classrooms | admin | admin · student (sa classe) · teacher (ses matières) | admin |
| subjects | admin · teacher | admin · teacher (sa matière) · student (sa classe) | admin |
| chapters | admin | admin · teacher · student (si matière accessible) | admin |
| chapter_contents | tous | admin · teacher · student (si matière accessible) | admin |
| videos | tous | admin · teacher · student (si matière accessible) | admin |
| video_progress | tous (filtré) | admin · owner | admin · owner |
| chapter_progress | tous (filtré) | admin · owner | admin · owner |

---

## 3. Modèles & relations

### User

| Champ | Type | Détail |
|---|---|---|
| `id` | bigint PK | |
| `name` | string | |
| `first_name` | string | |
| `last_name` | string | |
| `email` | string unique | |
| `password` | string (hashed) | |
| `role` | enum | `admin` · `teacher` · `student` |
| `school_id` | FK → schools | nullable |
| `classroom_id` | FK → classrooms | nullable |

Relations : `school`, `classroom`, `taughtSubjects`, `uploadedVideos`, `videoProgresses`

---

### School

| Champ | Type | Détail |
|---|---|---|
| `id` | bigint PK | |
| `name` | string | |
| `slug` | string unique | |
| `deleted_at` | timestamp | SoftDeletes |

Relations : `classrooms`, `users`, `subjects`

---

### Classroom

| Champ | Type | Détail |
|---|---|---|
| `id` | bigint PK | |
| `school_id` | FK → schools | |
| `level` | string | |
| `name` | string | |
| `slug` | string | unique (school_id, slug) |
| `deleted_at` | timestamp | SoftDeletes |

Relations : `school`, `students` (User), `subjects` (BelongsToMany)

---

### Subject

| Champ | Type | Détail |
|---|---|---|
| `id` | bigint PK | |
| `school_id` | FK → schools | |
| `teacher_id` | FK → users | formateur responsable |
| `name` | string | unique (school_id, name) |
| `description` | text | nullable |
| `referential_file_path` | string | PDF référentiel |
| `expected_hours` | decimal | volume horaire |
| `deleted_at` | timestamp | SoftDeletes |

Relations : `school`, `teacher`, `classrooms` (BelongsToMany), `chapters`

---

### Chapter

| Champ | Type | Détail |
|---|---|---|
| `id` | bigint PK | |
| `subject_id` | FK → subjects | |
| `title` | string | |
| `sort_order` | integer | unique (subject_id, sort_order) |
| `deleted_at` | timestamp | SoftDeletes |

Relations : `subject`, `videos`, `contents` (ChapterContent)

---

### Video

| Champ | Type | Détail |
|---|---|---|
| `id` | bigint PK | |
| `chapter_id` | FK → chapters | |
| `created_by` | FK → users | |
| `title` | string | |
| `description` | text | nullable |
| `source_url` | string | URL de la vidéo |
| `duration_seconds` | integer | durée totale en secondes |
| `sort_order` | integer | unique (chapter_id, sort_order) |
| `is_published` | boolean | |
| `deleted_at` | timestamp | SoftDeletes |

Relations : `chapter`, `creator`, `progressEntries` (VideoProgress)

---

### ChapterContent

| Champ | Type | Détail |
|---|---|---|
| `id` | bigint PK | |
| `chapter_id` | FK → chapters | |
| `created_by` | FK → users | |
| `type` | string | ex. `pdf`, `text`, `link` |
| `title` | string | |
| `description` | text | nullable |
| `content` | text | nullable |
| `source_url` | string | nullable |
| `file_path` | string | nullable |
| `duration_seconds` | integer | nullable |
| `sort_order` | integer | unique (chapter_id, sort_order) |
| `is_published` | boolean | |
| `deleted_at` | timestamp | SoftDeletes |

---

### VideoProgress

| Champ | Type | Détail |
|---|---|---|
| `id` | bigint PK | |
| `user_id` | FK → users | |
| `video_id` | FK → videos | |
| `watched_seconds_validated` | bigint | **en lecture seule via API — modifiable uniquement par le heartbeat** |
| `completion_percent` | decimal(5,2) | 0–100 |
| `status` | enum | `not_started` · `in_progress` · `completed` |
| `last_seen_at` | datetime | nullable |

Contrainte unique : `(user_id, video_id)` — un seul enregistrement par élève par vidéo.

> **Important :** `watched_seconds_validated` ne peut pas être défini depuis un POST ou PATCH normal. Il est incrémenté exclusivement par l'endpoint `/api/watch-sessions/heartbeat` après validation cryptographique.

---

### ChapterProgress

| Champ | Type | Détail |
|---|---|---|
| `id` | bigint PK | |
| `user_id` | FK → users | |
| `chapter_id` | FK → chapters | |
| `completion_percent` | decimal(5,2) | |
| `status` | string | `not_started` · `in_progress` · `completed` |
| `last_seen_at` | datetime | nullable |

Contrainte unique : `(user_id, chapter_id)`

---

## 4. Endpoints API Platform

> Toutes ces routes nécessitent `Authorization: Bearer <token>`.
> Base URL : `/` (API Platform monte à la racine).

### Auth

| Méthode | URI | Body | Réponse |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ token, email, role }` |
| POST | `/auth/logout` | — | 200 |
| GET | `/auth/me` | — | `{ id, email, role, … }` |

### Users

| Méthode | URI | Gate | Notes |
|---|---|---|---|
| GET | `/users` | `users.list` | admin only |
| GET | `/users/{id}` | `users.view` | self ou admin |
| POST | `/users` | `users.create` | admin only |
| PATCH | `/users/{id}` | `users.update` | admin only |
| DELETE | `/users/{id}` | `users.delete` | admin only |

### Schools

| Méthode | URI | Gate |
|---|---|---|
| GET | `/schools` | `schools.list` |
| GET | `/schools/{id}` | `schools.view` |
| POST | `/schools` | `schools.create` |
| PATCH | `/schools/{id}` | `schools.update` |
| DELETE | `/schools/{id}` | `schools.delete` |

### Classrooms / Subjects / Chapters / ChapterContents / Videos

Même pattern CRUD. Consultez les Gates du tableau §2 pour les restrictions d'accès.

| Ressource | URI base |
|---|---|
| Classrooms | `/classrooms` |
| Subjects | `/subjects` |
| Chapters | `/chapters` |
| ChapterContents | `/chapter-contents` |
| Videos | `/videos` |

### VideoProgress

| Méthode | URI | Gate | Notes |
|---|---|---|---|
| GET | `/video-progress` | `video_progress.list` | filtré owner/admin |
| GET | `/video-progress/{id}` | `video_progress.view` | owner ou admin |
| POST | `/video-progress` | `video_progress.create` | crée avec `watched_seconds_validated = 0` |
| PATCH | `/video-progress/{id}` | `video_progress.update` | **ne permet pas de modifier `watched_seconds_validated`** |
| DELETE | `/video-progress/{id}` | `video_progress.delete` | owner ou admin |

### ChapterProgress

Même pattern que VideoProgress, URI : `/chapter-progress`.

---

## 5. Système anti-triche — Watch Sessions

### Problème résolu

Sans ce système, n'importe quel client peut envoyer `watched_seconds_validated = 9999` sans avoir regardé la vidéo. Le heartbeat cryptographique rend cette fraude impossible.

### Principe

```
┌─ Client ────────────────────────────────────────────────────────┐
│  1. POST /api/watch-sessions/request                            │
│     { video_id, segment_start }                                 │
│     ← { token, seg_start, seg_end, expires_at }                 │
│                                                                 │
│  2. Regarde les 30 secondes du segment                          │
│                                                                 │
│  3. POST /api/watch-sessions/heartbeat                          │
│     { token }                                                   │
│     ← { validated_seconds, segment_validated,                   │
│          completion_percent, status }                           │
│                                                                 │
│  4. Répète dès le segment_start suivant                         │
└─────────────────────────────────────────────────────────────────┘
```

### Structure du token

Le token est une chaîne `base64(payload).HMAC-SHA256(base64(payload), APP_KEY)`.

**Payload (JSON) :**

```json
{
  "uid": 1,
  "vid": 5,
  "seg_start": 0,
  "seg_end": 30,
  "iat": 1748900000,
  "nonce": "a3f8c2e1..."
}
```

### Validations côté serveur

| Contrôle | Comportement en cas d'échec |
|---|---|
| Signature HMAC invalide | 422 — Signature de token invalide |
| `uid` ≠ utilisateur connecté | 422 — Token lié à un autre utilisateur |
| Nonce absent du cache | 422 — Token expiré |
| Nonce déjà consommé | 422 — Replay détecté |
| Soumis trop tôt (`now < iat + durée - 5s`) | 422 — Heartbeat soumis trop tôt |
| Soumis trop tard (`now > iat + durée + 60s`) | 422 — Token expiré |

### Paramètres du service (`WatchTokenService`)

| Constante | Valeur | Rôle |
|---|---|---|
| `SEGMENT_SECONDS` | 30 | Durée d'un segment |
| `TIMING_TOLERANCE_EARLY` | 5s | Tolérance réseau côté précoce |
| `TIMING_BUFFER_LATE` | 60s | Buffer pour les connexions lentes |
| `NONCE_TTL_EXTRA` | 120s | Durée de vie cache nonce au-delà du segment |

### Accumulation de la progression

- `watched_seconds_validated` n'est jamais décrémenté.
- Plafonné à `video.duration_seconds`.
- `completion_percent` et `status` sont recalculés à chaque heartbeat validé.

### Endpoints watch sessions

> Base : `/api/` (préfixe Laravel standard, distinct de l'API Platform)

#### `POST /api/watch-sessions/request`

**Auth :** `Bearer <token>` (Sanctum)

**Body :**
```json
{
  "video_id": 5,
  "segment_start": 0
}
```

**Réponse 201 :**
```json
{
  "token": "eyJ1...<base64>..<hmac>",
  "seg_start": 0,
  "seg_end": 30,
  "expires_at": "2026-06-02T14:01:10+00:00"
}
```

**Erreurs :**
- `403` — gate `videos.view` non satisfaite
- `422` — segment_start ≥ durée vidéo

---

#### `POST /api/watch-sessions/heartbeat`

**Auth :** `Bearer <token>` (Sanctum)

**Body :**
```json
{
  "token": "eyJ1...<base64>..<hmac>"
}
```

**Réponse 200 :**
```json
{
  "validated_seconds": 30,
  "segment_validated": 30,
  "completion_percent": 12.50,
  "status": "in_progress"
}
```

**Erreurs :**
- `422` — toute validation échouée (voir tableau §Validations)

---

## 6. Vues agrégées

> Routes sous `/api/aggregates/` — auth Sanctum requise.

### `GET /api/aggregates/teacher`

**Accès :** formateur (ses propres matières) · admin (toutes les matières de l'école, ou filtrées par `?teacher_id=X`)

**Réponse :**
```json
[
  {
    "id": 1,
    "name": "Développement Web",
    "totalVideos": 10,
    "totalSeconds": 3600,
    "classrooms": [
      {
        "id": 2,
        "name": "Terminale B",
        "level": "Terminale",
        "students": [
          {
            "id": 5,
            "firstName": "Alice",
            "lastName": "Martin",
            "email": "alice@school.fr",
            "progress": {
              "totalVideos": 10,
              "completedVideos": 4,
              "inProgressVideos": 2,
              "notStartedVideos": 4,
              "watchedSeconds": 1200,
              "totalSeconds": 3600,
              "completionPercent": 33.3
            }
          }
        ]
      }
    ]
  }
]
```

**Logique :** `completionPercent = watchedSeconds / totalSeconds × 100` (basé sur la durée réelle, pas sur le nombre de vidéos).

---

### `GET /api/aggregates/school`

**Accès :** admin uniquement (école de l'admin connecté)

**Réponse :**
```json
[
  {
    "id": 2,
    "name": "Terminale B",
    "level": "Terminale",
    "students": [
      {
        "id": 5,
        "firstName": "Alice",
        "lastName": "Martin",
        "email": "alice@school.fr",
        "subjects": [
          {
            "subjectId": 1,
            "subjectName": "Développement Web",
            "totalVideos": 10,
            "completedVideos": 4,
            "inProgressVideos": 2,
            "notStartedVideos": 4,
            "watchedSeconds": 1200,
            "totalSeconds": 3600,
            "completionPercent": 33.3
          }
        ]
      }
    ]
  }
]
```

**Performance :** toutes les `VideoProgress` concernées sont chargées en une seule requête SQL, puis groupées en mémoire.

---

## 7. State Processors & Providers

### Processors

| Classe | Opération | Rôle |
|---|---|---|
| `Auth/AuthLoginProcessor` | POST `/auth/login` | Vérifie credentials, émet token Sanctum |
| `Auth/AuthLogoutProcessor` | POST `/auth/logout` | Révoque le token courant |
| `Auth/AuthMeProcessor` | GET `/auth/me` | Retourne l'utilisateur authentifié |
| `User/UserCreateProcessor` | POST `/users` | Valide unicité email, crée user |
| `School/SchoolCreateProcessor` | POST `/schools` | Valide unicité slug |
| `Classroom/ClassroomCreateProcessor` | POST `/classrooms` | — |
| `Subject/SubjectCreateProcessor` | POST `/subjects` | — |
| `Chapter/ChapterCreateProcessor` | POST `/chapters` | — |
| `ChapterContent/ChapterContentCreateProcessor` | POST `/chapter-contents` | — |
| `Video/VideoCreateProcessor` | POST `/videos` | Vérifie chapter, prévient doublons sort_order |
| `VideoProgress/VideoProgressCreateProcessor` | POST `/video-progress` | Vérifie video, anti-doublon, `watched_seconds = 0` forcé |
| `VideoProgress/VideoProgressUpdateProcessor` | PATCH `/video-progress/{id}` | Met à jour sauf `watched_seconds_validated` |
| `ChapterProgress/ChapterProgressCreateProcessor` | POST `/chapter-progress` | Auto-assigne user_id |

### Providers

| Classe | Opération | Logique |
|---|---|---|
| `VideoProgress/VideoProgressCollectionProvider` | GET `/video-progress` | Admin → tout ; user → ses propres enregistrements |
| `ChapterProgress/ChapterProgressCollectionProvider` | GET `/chapter-progress` | Admin → tout ; user → ses propres enregistrements |
| `Subject/MySubjectsProcessor` | — | Matières du formateur connecté |

---

## 7. Sécurité & règles métier

### Ce qui est protégé

- **Authentification** : toutes les routes nécessitent `auth:sanctum`
- **Isolation école** : `school_id`/`classroom_id` filtrés dans les Gates
- **Anti-replay** : nonce à usage unique stocké en cache
- **Anti-accélération** : la fenêtre temporelle du token interdit de simuler le visionnage
- **Plafonnement** : `watched_seconds_validated` ne peut dépasser `video.duration_seconds`
- **Écriture protégée** : `watched_seconds_validated` inaccessible via POST/PATCH normaux

### Limites actuelles (à implémenter)

| Limitation | Impact |
|---|---|
| Pas de logs d'activité | Aucune traçabilité des actions admin |
| Pas de middleware global school | Un bug dans une Gate peut permettre une fuite inter-école |
| Pas d'anonymisation RGPD | SoftDeletes présents, données non anonymisées |
| Vues agrégées absentes | Formateur et école ne voient pas les stats globales |
| Un user = une école | Relation `school_id` unique sur `users` |

---

## 8. À faire (backend)

```
[ ] Vues agrégées
      - Endpoint formateur : progression de chaque élève sur ses matières
      - Endpoint école : vue globale par classe/matière

[ ] Multi-école par user
      - Migrer school_id (FK unique) → table pivot user_school (N-N)

[ ] Logs d'activité
      - Table audit_logs (user_id, action, model_type, model_id, payload, ip, created_at)
      - Observer Eloquent ou Events Laravel

[ ] Conformité RGPD
      - Route DELETE /auth/me → anonymisation (email, nom → hash)
      - Route GET /auth/me/export → dump données personnelles (JSON)
```
