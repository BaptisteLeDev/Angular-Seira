---
theme: seriph
title: MontoMaster V2 — Roadmap technique
info: |
  ## MontoMaster V2
  Roadmap technique — Backend · Web · Mobile (hors IA).
  Plateforme e-learning, remplaçant de Seira.
author: Équipe MontoMaster
addons:
  - slidev-addon-qrcode
colorSchema: dark
canvasWidth: 1000
fonts:
  sans: Inter
  serif: Manrope
  mono: Fira Code
  weights: '400,500,600,700,800'
transition: slide-left
mdc: true
drawings:
  persist: false
class: text-center
---

# MontoMaster <span class="text-3xl opacity-60">V2</span>

Roadmap technique — **Backend → Web → Mobile**

<div class="mt-6 text-base opacity-70">
La plateforme e-learning nouvelle génération qui remplace Seira
</div>

<div class="mt-10 flex justify-center gap-3 text-xs">
  <span class="mm-chip" style="color:#7bd0ff">Laravel · API Platform</span>
  <span class="mm-chip" style="color:#c084fc">Angular 21</span>
  <span class="mm-chip" style="color:#34d399">Expo / React Native</span>
</div>

<div class="abs-br m-6 text-xs opacity-50">
  Présentation pour développeurs · périmètre hors IA
</div>

<!--
Deck destiné aux devs : on parcourt ce qu'il reste à construire, par plateforme, avec schémas (classe, MLD/MPD, séquence, state, userflow). L'IA (transcription + RAG + chat) est volontairement hors périmètre de cette session.
-->

---
transition: fade-out
layout: two-cols
layoutClass: gap-12
---

# Sommaire

Trois plateformes, **une seule API**.
On déroule dans l'ordre des dépendances :

<div class="mt-6 flex flex-col gap-3 text-sm">
  <div class="mm-card"><b style="color:#7bd0ff">1 · Backend</b> — fondation, contrats, sécurité</div>
  <div class="mm-card"><b style="color:#c084fc">2 · App Web</b> — Angular, consomme l'API</div>
  <div class="mm-card"><b style="color:#34d399">3 · App Mobile</b> — Expo, miroir du web</div>
</div>

---
transition: slide-left
---

# Vision & périmètre

<div class="grid grid-cols-2 gap-8 mt-4">

<div>

### ✅ Dans le périmètre

- **Anti-triche** : validation serveur du temps de visionnage
- **Suivi pédagogique** : progression élève, dashboards
- **Gestion multi-écoles**, classes, matières, contenus
- **Sécurité & conformité** : RBAC, logs, RGPD
- **Lecteur vidéo contrôlé** (web + mobile)

</div>

<div>

### 🚫 Hors périmètre (cette session)

- Transcription automatique des vidéos
- Indexation & RAG
- Agent conversationnel / chat contextuel

<div class="mm-card mt-6" style="border-color:#fbbf24">
<b style="color:#fbbf24">Pourquoi ?</b><br>
La couche IA dépend d'une base saine : modèle de données, tracking certifié et contrats d'API stabilisés <em>d'abord</em>.
</div>

</div>

</div>

---
transition: slide-up
---

# Architecture — monorepo, une API

```mermaid {scale: 0.72}
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
  GATE -.cache/sessions.-> RDS
```

<div class="text-xs opacity-60 mt-2 text-center">
Web & mobile partagent <b>le même contrat OpenAPI</b> — schémas Zod côté clients, IRI → ids via <code>utils/iri</code>.
</div>

---
transition: slide-left
---

# Modèle de données — existant

```mermaid {scale: 0.62}
classDiagram
  direction LR
  class User {
    +id
    +role: admin|teacher|student
    +school_id
    +classroom_id
  }
  class School { +id +name +slug }
  class Classroom { +id +school_id +level }
  class Subject {
    +id +name +school_id +teacher_id
    +referential_file_path
    +expected_hours
  }
  class Chapter { +id +subject_id +sort_order }
  class Video { +id +chapter_id +source_url +duration_seconds }
  class ChapterContent { +id +chapter_id +type +file_path }
  class VideoProgress {
    +id +user_id +video_id
    +watched_seconds_validated
    +completion_percent
    +status
  }

  School "1" --> "*" Classroom
  School "1" --> "*" Subject
  School "1" --> "*" User
  Classroom "*" --> "*" Subject : classroom_subject
  Subject "1" --> "*" Chapter
  Chapter "1" --> "*" Video
  Chapter "1" --> "*" ChapterContent
  User "1" --> "*" VideoProgress
  Video "1" --> "*" VideoProgress
```

<div class="text-xs opacity-60 mt-1 text-center">
8 entités · SoftDeletes actifs · <code>SCHEMA_BDD.md</code> = source de vérité
</div>

---
transition: fade
layout: center
class: text-center
---

# Comment lire ce deck

<div class="flex justify-center gap-4 mt-8 text-sm">
  <span class="mm-chip mm-chip-done">✅ Déjà codé</span>
  <span class="mm-chip mm-chip-partial">◑ Partiel</span>
  <span class="mm-chip mm-chip-todo">🔲 À construire</span>
</div>

<div class="grid grid-cols-2 gap-6 mt-10 text-left text-sm max-w-3xl mx-auto">
  <div class="mm-card">📐 <b>classDiagram</b> — diagramme de classes</div>
  <div class="mm-card">🗄️ <b>erDiagram</b> — MLD / MPD (Merise)</div>
  <div class="mm-card">🔁 <b>sequenceDiagram</b> — flux client ↔ serveur</div>
  <div class="mm-card">🔀 <b>stateDiagram</b> — machine à états</div>
  <div class="mm-card">🧭 <b>flowchart</b> — userflow / parcours</div>
  <div class="mm-card">👤 <b>User stories</b> — « En tant que… »</div>
</div>

<div class="text-xs opacity-50 mt-8">Chaque feature référence son issue GitHub (#18 → #26).</div>

---
src: ./pages/backend.md
---

---
src: ./pages/web.md
---

---
src: ./pages/mobile.md
---

---
src: ./pages/cloture.md
---
