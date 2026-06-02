---
layout: section
transition: slide-left
---

# 2 · Conception
<div class="text-base opacity-70 mt-2">Architecture logicielle · Maquettes · BDD · UML</div>

---
layout: default
---

# Spécifications fonctionnelles

<div class="grid grid-cols-2 gap-8 mt-2 text-sm">

<div>

### Fonctionnalités clés

<div class="flex flex-col gap-2">
  <div class="mm-card">Authentification & gestion des rôles</div>
  <div class="mm-card">Gestion multi-écoles · classes · matières</div>
  <div class="mm-card">Parcours de cours (chapitres → vidéos / PDF)</div>
  <div class="mm-card"><b style="color:#7bd0ff">Lecture vidéo contrôlée anti-triche</b></div>
  <div class="mm-card">Suivi de progression certifié + dashboards</div>
</div>

</div>

<div>

### User stories représentatives

<div class="flex flex-col gap-2">
  <div class="mm-card">
  <b style="color:#34d399">En tant qu'</b>élève, je veux que mon temps de visionnage se valide automatiquement quand je regarde vraiment, afin que ma progression soit juste.
  </div>
  <div class="mm-card">
  <b style="color:#c084fc">En tant que</b> formateur, je veux un suivi fiable de mes élèves, afin de m'appuyer sur des statistiques certifiées.
  </div>
</div>

</div>

</div>

---
layout: center
---

# Architecture logicielle — monorepo, une API

```mermaid {scale: 0.78}
flowchart LR
  subgraph Clients
    WEB["🌐 Frontend<br/>Angular 21 · signals · Zod"]
    MOB["📱 Mobile<br/>Expo · expo-router · zustand"]
  end

  subgraph API["🛠️ API Laravel 12 + API Platform"]
    AP["#[ApiResource] sur modèles Eloquent"]
    SAN["Sanctum · tokens Bearer"]
    GATE["Gates RBAC<br/>admin / teacher / student"]
  end

  subgraph Data
    DB[("MariaDB 11")]
    RDS[("Redis 7")]
  end

  WEB -->|"REST + JSON-LD / Hydra"| AP
  MOB -->|"REST + JSON-LD / Hydra"| AP
  AP --> SAN --> GATE --> DB
  GATE -.cache/nonces.-> RDS
```

---

# Architecture en couches — côté API

<div class="grid grid-cols-2 gap-6 mt-2">

<div>

L'application est organisée en **couches** découplées, du transport vers la persistance :

<div class="text-sm flex flex-col gap-2 mt-3">
  <div class="mm-card"><b style="color:#7bd0ff">Présentation</b> — opérations <code>#[ApiResource]</code> + OpenAPI</div>
  <div class="mm-card"><b style="color:#c084fc">Validation</b> — DTO d'entrée (<code>*CreateInput</code>)</div>
  <div class="mm-card"><b style="color:#34d399">Métier</b> — State Processors / Providers, Services</div>
  <div class="mm-card"><b style="color:#fbbf24">Accès données</b> — modèles Eloquent + Redis</div>
</div>

</div>

<div>

```mermaid {scale: 0.6}
flowchart TB
  REQ["Requête HTTP"] --> MW["middleware auth:sanctum"]
  MW --> POL["Gate (policy RBAC)"]
  POL --> DTO["DTO d'entrée validé"]
  DTO --> PROC["State Processor / Service"]
  PROC --> ELO["Eloquent (SQL)"]
  PROC --> RED["Cache Redis (NoSQL)"]
  ELO --> DB[("MariaDB")]
  RED --> RDS[("Redis")]
```

</div>

</div>

---

# Maquettes & enchaînement des écrans

<div class="grid grid-cols-2 gap-6 mt-2">

<div>

### Enchaînement (parcours élève)

```mermaid {scale: 0.55}
flowchart TD
  L["/login"] --> D["Accueil élève"]
  D --> M["Mes matières"]
  M --> CH["Chapitre / cours"]
  CH --> V["Lecteur vidéo contrôlé"]
  V --> P["Ma progression"]
```

</div>

<div>

### Maquette — suivi (formateur)

<div class="mm-card text-xs font-mono leading-relaxed mt-2">
┌────────────────────────────┐<br>
│ Suivi · Classe 3A   [filtre]│<br>
├──────────┬─────────┬────────┤<br>
│ Élève    │ Matière │ %      │<br>
├──────────┼─────────┼────────┤<br>
│ A. Dupont│ Angular │ ▓▓▓▓░ 78│<br>
│ B. Martin│ Angular │ ▓▓░░░ 41│<br>
│ C. Leroy │ Laravel │ ▓▓▓▓▓ 96│<br>
└──────────┴─────────┴────────┘
</div>

</div>

</div>

<div class="text-xs opacity-60 mt-3 text-center">
Les captures des interfaces réelles (web & mobile) sont présentées en section <b>Réalisations</b>.
</div>

---
layout: center
---

# Modèle conceptuel de données (MCD)

```mermaid {scale: 0.62}
erDiagram
  SCHOOL ||--o{ CLASSROOM : "comporte"
  SCHOOL ||--o{ SUBJECT : "propose"
  SCHOOL }o--o{ USER : "rattache (user_school)"
  CLASSROOM }o--o{ SUBJECT : "suit (classroom_subject)"
  SUBJECT ||--o{ CHAPTER : "structure"
  CHAPTER ||--o{ VIDEO : "contient"
  CHAPTER ||--o{ CHAPTER_CONTENT : "contient"
  USER ||--o{ VIDEO_PROGRESS : "réalise"
  VIDEO ||--o{ VIDEO_PROGRESS : "mesurée par"
  USER ||--o{ CHAPTER_PROGRESS : "réalise"
  CHAPTER ||--o{ CHAPTER_PROGRESS : "mesuré par"
```

---
layout: center
---

# Modèle physique de données (MPD)

<div class="flex justify-center">

```mermaid {scale: 0.34}
erDiagram
  SCHOOLS {
    bigint id PK
    varchar slug UK
  }
  CLASSROOMS {
    bigint id PK
    bigint school_id FK
  }
  SUBJECTS {
    bigint id PK
    bigint school_id FK
    bigint teacher_id FK
  }
  CLASSROOM_SUBJECT {
    bigint classroom_id FK
    bigint subject_id FK
  }
  CHAPTERS {
    bigint id PK
    bigint subject_id FK
    int sort_order
  }
  VIDEOS {
    bigint id PK
    bigint chapter_id FK
    int duration_seconds
  }
  VIDEO_PROGRESS {
    bigint id PK
    bigint user_id FK
    bigint video_id FK
    int watched_seconds_validated
    varchar status
  }
  USERS {
    bigint id PK
    bigint school_id FK
    bigint classroom_id FK
    varchar role
  }

  SCHOOLS ||--o{ CLASSROOMS : ""
  SCHOOLS ||--o{ SUBJECTS : ""
  CLASSROOMS ||--o{ CLASSROOM_SUBJECT : ""
  SUBJECTS ||--o{ CLASSROOM_SUBJECT : ""
  SUBJECTS ||--o{ CHAPTERS : ""
  CHAPTERS ||--o{ VIDEOS : ""
  USERS ||--o{ VIDEO_PROGRESS : ""
  VIDEOS ||--o{ VIDEO_PROGRESS : ""
```

</div>

---
layout: center
---

# Cas d'utilisation

```mermaid {scale: 0.62}
flowchart LR
  ADMIN(["👤 Admin / École"])
  TEACHER(["👤 Formateur"])
  STUDENT(["👤 Élève"])

  subgraph Système["MontoMaster"]
    UC1(["Gérer écoles / classes / matières"])
    UC2(["Gérer les utilisateurs"])
    UC3(["Créer les contenus<br/>chapitres · vidéos · PDF"])
    UC4(["Suivre la progression<br/>des élèves"])
    UC5(["Consulter ses cours"])
    UC6(["Visionner une vidéo<br/>(temps certifié)"])
    UC7(["Consulter sa progression"])
  end

  ADMIN --> UC1
  ADMIN --> UC2
  TEACHER --> UC3
  TEACHER --> UC4
  STUDENT --> UC5
  STUDENT --> UC6
  STUDENT --> UC7
```

---
layout: center
---

# Séquence — cas le plus significatif (anti-triche)

```mermaid {scale: 0.5}
sequenceDiagram
  autonumber
  participant C as Client (player)
  participant API as WatchSessionController
  participant TS as WatchTokenService
  participant R as Redis
  participant DB as MariaDB

  C->>API: POST /watch-sessions/request { video_id, segment_start }
  API->>API: Gate videos.view (RBAC)
  API->>TS: generate(uid, vid, seg, duration)
  TS->>R: put nonce = "pending" (TTL court)
  TS-->>C: { token HMAC, seg_start, seg_end, expires_at }

  Note over C: lecture du segment (~30 s)

  C->>API: POST /watch-sessions/heartbeat { token }
  API->>TS: validate(token, uid)
  TS->>TS: vérifie signature + fenêtre temporelle
  TS->>R: nonce ? (pending / used / expiré)
  alt clé valide
    TS->>R: consume(nonce) = "used"
    API->>DB: crédite VideoProgress (borné à la durée)
    API-->>C: 200 { validated_seconds, completion_percent, status }
  else rejet
    API-->>C: 422 (replay · trop tôt · expiré · signature)
  end
```
