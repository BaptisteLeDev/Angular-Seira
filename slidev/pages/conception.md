---
layout: section
transition: slide-left
---

# 2 · Conception
<div class="text-base opacity-70 mt-2">Architecture logicielle · Maquettes · BDD · UML</div>

<!--
Deuxième partie : la conception. On va dérouler les spécifications, l'architecture en couches, les maquettes, puis la modélisation de données et l'UML.
-->

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

<!--
On a formalisé cinq fonctionnalités clés : l'authentification et les rôles, la gestion multi-écoles, les parcours de cours, le cœur du projet — la lecture vidéo contrôlée anti-triche — et le suivi de progression avec ses dashboards. On s'appuie sur des user stories : celle de l'élève qui veut que son temps se valide automatiquement quand il regarde vraiment, et celle du formateur qui veut un suivi fiable. Vous voyez que ces deux stories pointent la même exigence : la fiabilité de la donnée de progression. C'est elle qui justifie tout le dispositif technique qu'on va détailler.
-->

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

<!--
Voici la vue d'ensemble. Un monorepo, trois applications, mais une seule API. Les deux clients — Angular avec signals et Zod, Expo avec zustand — parlent à l'API Laravel en REST, au format JSON-LD/Hydra produit par API Platform. Particularité qu'on détaillera : l'API est déclarée directement sur les modèles Eloquent via l'attribut ApiResource, sans contrôleurs REST classiques. La requête traverse Sanctum pour l'authentification, puis les Gates RBAC pour l'autorisation, avant d'atteindre MariaDB. Et Redis, à côté, porte l'état éphémère de l'anti-triche — les nonces et le cache. Ce découplage clients/API est ce qui nous a permis de développer le web et le mobile en parallèle sans dupliquer la logique métier.
-->

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

<!--
En zoomant sur l'API, on retrouve une architecture en couches classique mais bien séparée. Couche présentation : les opérations ApiResource, qui génèrent aussi l'OpenAPI. Couche validation : des DTO d'entrée dédiés, découplés du modèle. Couche métier : les State Processors et Providers, et les services. Couche accès données : Eloquent pour le SQL, Redis pour le NoSQL. Le diagramme de droite montre le trajet d'une requête : middleware d'auth, puis Gate, puis DTO validé, puis Processor, puis persistance. Cette séparation est exactement ce que le référentiel attend sous « concevoir et développer une application en couches ».
-->

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

<!--
Côté maquettes, on a d'abord travaillé l'enchaînement des écrans pour le parcours élève : du login jusqu'à « ma progression », en passant par le catalogue, le chapitre et le lecteur contrôlé. À droite, une maquette du tableau de suivi formateur — la donnée certifiée remontée par classe et par matière. On montre ici la basse-fidélité ; les captures des écrans réels arrivent en partie Réalisations, pour bien distinguer la phase de conception de la phase de réalisation.
-->

---
layout: center
---

# Arborescence & navigation — espace élève

```mermaid {scale: 0.48}
flowchart TB
  subgraph WEB["🌐 Web — espace élève"]
    direction TB
    WL["/login"] --> WD["Dashboard"]
    WD --> WS["Mon espace"]
    WS --> WF["Catalogue matières"]
    WF --> WFD["Détail formation<br/>chapitres · gating"]
    WFD --> WV["Lecteur vidéo<br/>temps certifié"]
    WD --> WP["Ma progression"]
    WV --> WP
  end
  subgraph MOB["📱 Mobile — navigation par onglets"]
    direction TB
    ML["Login"] --> MTAB["Tab bar"]
    MTAB --> MDA["Tableau"]
    MTAB --> MSU["Matières"]
    MTAB --> MSE["Paramètres"]
    MSU --> MFD["Formation · programme"]
    MFD --> MV["Lecteur + sommaire"]
    MDA --> MCL["Ma classe"]
    MDA --> MPR["Ma progression"]
  end
```

<div class="text-xs opacity-60 mt-2 text-center">
6 écrans côté web · 6 écrans côté mobile — mêmes domaines, navigation adaptée à chaque plateforme.
</div>

<!--
Cette arborescence illustre la parité qu'on évoquait. À gauche le web, organisé par routes ; à droite le mobile, organisé par onglets avec Expo Router. Mêmes domaines des deux côtés — dashboard, matières, formation, lecteur, progression — mais une navigation adaptée à chaque plateforme : du routing classique sur le web, une tab bar sur mobile. Six écrans de chaque côté. C'est le même modèle mental pour l'utilisateur, qu'il soit sur navigateur ou sur téléphone.
-->

---
layout: default
---

# Wireframe web — écrans élève

<div class="text-xs opacity-60 -mt-2 mb-1">Basse-fidélité · squelette UI : placeholders image ✕, boutons, recherche, navigation — monochrome bleu</div>

<div class="grid grid-cols-3 gap-4 mt-1">

<div>
<div class="wf-win">
  <div class="wf-top"><span class="wf-dot"></span><span class="wf-dot"></span><span class="wf-dot"></span><span class="wf-url">monto.app/student</span></div>
  <div class="wf-body">
    <div class="wf-nav"><span class="lo">Monto</span><span class="mn">Accueil · Matières · Progression</span><span class="wf-av">L</span></div>
    <div class="wf-h" style="width:52%"></div>
    <div class="wf-l" style="width:36%"></div>
    <div class="wf-card wf-row"><span class="wf-ic"></span><div class="wf-t" style="flex:1"><div class="wf-h" style="width:55%;height:7px"></div><div class="wf-l" style="width:32%"></div></div></div>
    <div class="wf-lab">Mes matières</div>
    <div class="wf-g2">
      <div class="wf-card wf-row"><span class="wf-ic"></span><div class="wf-l" style="flex:1"></div></div>
      <div class="wf-card wf-row"><span class="wf-ic"></span><div class="wf-l" style="flex:1"></div></div>
      <div class="wf-card wf-row"><span class="wf-ic"></span><div class="wf-l" style="flex:1"></div></div>
      <div class="wf-card wf-row"><span class="wf-ic"></span><div class="wf-l" style="flex:1"></div></div>
    </div>
    <button class="wf-b p bl">Voir ma progression →</button>
  </div>
</div>
<div class="wf-cap">Mon espace · hub élève</div>
</div>

<div>
<div class="wf-win">
  <div class="wf-top"><span class="wf-dot"></span><span class="wf-dot"></span><span class="wf-dot"></span><span class="wf-url">monto.app/formations</span></div>
  <div class="wf-body">
    <div class="wf-nav"><span class="lo">Monto</span><span class="mn">Accueil · Matières · Progression</span><span class="wf-av">L</span></div>
    <div class="wf-h" style="width:45%"></div>
    <div class="wf-in">Rechercher une matière…</div>
    <div class="wf-row"><span class="wf-c on">Tous</span><span class="wf-c">Dev</span><span class="wf-c">Design</span><span class="wf-c">Comm</span></div>
    <div class="wf-g2">
      <div class="wf-card wf-t" style="gap:5px"><div class="wf-img" style="min-height:36px"></div><div class="wf-h" style="width:70%;height:7px"></div><div class="wf-l" style="width:90%"></div><button class="wf-b" style="margin-top:2px">Voir</button></div>
      <div class="wf-card wf-t" style="gap:5px"><div class="wf-img" style="min-height:36px"></div><div class="wf-h" style="width:62%;height:7px"></div><div class="wf-l" style="width:85%"></div><button class="wf-b" style="margin-top:2px">Voir</button></div>
    </div>
    <div class="wf-card wf-row wf-mut"><span style="font-size:9px;color:#9fc2d8">🔒</span><div class="wf-l" style="flex:1"></div></div>
  </div>
</div>
<div class="wf-cap">Catalogue · recherche + cartes matières</div>
</div>

<div>
<div class="wf-win">
  <div class="wf-top"><span class="wf-dot"></span><span class="wf-dot"></span><span class="wf-dot"></span><span class="wf-url">…/formations/12</span></div>
  <div class="wf-body">
    <div class="wf-bc">‹ Catalogue › Angular 21</div>
    <div class="wf-img" style="min-height:40px"></div>
    <div class="wf-h" style="width:58%"></div>
    <div class="wf-row"><span class="wf-c">12 chapitres</span><span class="wf-c">47 contenus</span><span class="wf-c">3 h</span></div>
    <div class="wf-row"><div class="wf-pg" style="flex:1"><i style="width:45%"></i></div><span style="font-size:8px;color:#7bd0ff">45%</span></div>
    <div class="wf-lab">Chapitre 1 — Fondamentaux ▾</div>
    <div class="wf-card wf-row"><span class="wf-ic"></span><div class="wf-l" style="flex:1"></div><span class="wf-c">6 min</span></div>
    <div class="wf-card wf-row"><span class="wf-ic"></span><div class="wf-l" style="flex:1"></div><span class="wf-c">9 min</span></div>
    <div class="wf-card wf-row wf-mut"><span style="font-size:9px">🔒</span><div class="wf-l" style="flex:1"></div></div>
  </div>
</div>
<div class="wf-cap">Détail formation · programme + gating</div>
</div>

</div>

<!--
Voici les wireframes basse-fidélité des trois écrans élève côté web : le hub « mon espace », le catalogue avec recherche et filtres par catégorie, et le détail d'une formation. Notez sur ce dernier le verrou — le « gating » : les chapitres se déverrouillent au fur et à mesure, on ne peut pas sauter en avant. C'est la traduction visuelle de l'anti-triche au niveau du parcours. Ces squelettes monochromes nous ont servi à figer la structure avant de coder l'UI.
-->

---
layout: default
---

# Wireframe web — lecteur anti-triche & progression

<div class="text-xs opacity-60 -mt-2 mb-1">L'écran signature : visionnage à temps certifié, et son tableau de bord de suivi</div>

<div class="grid grid-cols-2 gap-6 mt-1">

<div>
<div class="wf-win">
  <div class="wf-top"><span class="wf-dot"></span><span class="wf-dot"></span><span class="wf-dot"></span><span class="wf-url">…/formations/12/47</span></div>
  <div class="wf-body">
    <div class="wf-bc">‹ Chapitre 1 — Les signals Angular</div>
    <div class="wf-img vid" style="min-height:96px"></div>
    <div class="wf-row"><div class="wf-pg" style="flex:1"><i style="width:62%"></i></div><span style="font-size:8px;color:#7bd0ff">12:30 / 20:00</span></div>
    <div class="wf-row"><button class="wf-b" style="flex:1">‹ Précédent</button><button class="wf-b p" style="flex:1">Suivant ›</button></div>
    <div class="wf-card"><div class="wf-lab" style="color:#7bd0ff">⏱ Temps certifié — anti-triche</div><div class="wf-t" style="margin-top:6px"><div class="wf-l"></div><div class="wf-l" style="width:80%"></div></div><div style="font-size:8px;color:#6f9bb8;margin-top:5px">heartbeat 30 s · token HMAC · nonce Redis</div></div>
  </div>
</div>
<div class="wf-cap">Lecteur vidéo contrôlé · cœur du dispositif</div>
</div>

<div>
<div class="wf-win">
  <div class="wf-top"><span class="wf-dot"></span><span class="wf-dot"></span><span class="wf-dot"></span><span class="wf-url">monto.app/progression</span></div>
  <div class="wf-body">
    <div class="wf-nav"><span class="lo">Monto</span><span class="mn">Accueil · Matières · Progression</span><span class="wf-av">L</span></div>
    <div class="wf-h" style="width:40%"></div>
    <div class="wf-row" style="gap:6px">
      <div class="wf-card" style="flex:1;text-align:center"><div class="wf-k">4 h</div><div class="wf-l" style="width:70%;margin:5px auto 0"></div></div>
      <div class="wf-card" style="flex:1;text-align:center"><div class="wf-k">58%</div><div class="wf-l" style="width:70%;margin:5px auto 0"></div></div>
      <div class="wf-card" style="flex:1;text-align:center"><div class="wf-k">3</div><div class="wf-l" style="width:70%;margin:5px auto 0"></div></div>
      <div class="wf-card" style="flex:1;text-align:center"><div class="wf-k">2</div><div class="wf-l" style="width:70%;margin:5px auto 0"></div></div>
    </div>
    <div class="wf-card"><div class="wf-row"><div class="wf-l" style="flex:1"></div><span class="wf-c on">en cours</span></div><div class="wf-pg" style="margin-top:6px"><i style="width:78%"></i></div></div>
    <div class="wf-card"><div class="wf-row"><div class="wf-l" style="flex:1"></div><span class="wf-c">terminé</span></div><div class="wf-pg" style="margin-top:6px"><i style="width:96%"></i></div></div>
    <div class="wf-card wf-mut"><div class="wf-row"><div class="wf-l" style="flex:1"></div><span class="wf-c">à faire</span></div><div class="wf-pg" style="margin-top:6px"><i style="width:4%"></i></div></div>
  </div>
</div>
<div class="wf-cap">Ma progression · KPI + statut par matière</div>
</div>

</div>

<!--
Ces deux écrans sont la signature du projet. À gauche, le lecteur vidéo contrôlé : sous la vidéo, un encart « temps certifié » qui matérialise le dispositif — un heartbeat toutes les 30 secondes, un token HMAC, un nonce en Redis. C'est là que se joue l'anti-triche, on détaillera le mécanisme en partie Réalisations. À droite, l'écran « ma progression » : des KPI en haut — temps, pourcentage, formations en cours et terminées — puis le statut par matière. L'enjeu de conception ici était de rendre lisible une donnée qui, derrière, est garantie côté serveur.
-->

---
layout: default
---

# Wireframe mobile — écrans élève

<div class="text-xs opacity-60 -mt-2 mb-1">Format mobile (393×852) · navigation par onglets (Expo Router) — mêmes domaines que le web</div>

<div class="grid grid-cols-4 gap-4 mt-1">

<div>
<div class="wf-phone">
  <div class="wf-notch"><i></i></div>
  <div class="wf-body" style="padding:8px;gap:7px">
    <div class="wf-h" style="width:60%"></div>
    <div class="wf-l" style="width:42%"></div>
    <button class="wf-b p bl">Parcourir les matières</button>
    <div class="wf-g2">
      <div class="wf-card wf-t" style="align-items:center;gap:5px"><span class="wf-ic"></span><div class="wf-l" style="width:75%"></div></div>
      <div class="wf-card wf-t" style="align-items:center;gap:5px"><span class="wf-ic"></span><div class="wf-l" style="width:75%"></div></div>
    </div>
  </div>
  <div class="wf-tb"><div class="on"><span class="ic"></span><span>Tableau</span></div><div><span class="ic"></span><span>Matières</span></div><div><span class="ic"></span><span>Param.</span></div></div>
</div>
<div class="wf-cap">Dashboard</div>
</div>

<div>
<div class="wf-phone">
  <div class="wf-notch"><i></i></div>
  <div class="wf-body" style="padding:8px;gap:7px">
    <div class="wf-h" style="width:50%"></div>
    <div class="wf-in">Rechercher…</div>
    <div class="wf-card wf-row"><div class="wf-img" style="min-height:28px;width:34px"></div><div class="wf-t" style="flex:1;gap:4px"><div class="wf-l" style="width:80%"></div><div class="wf-l" style="width:50%"></div></div></div>
    <div class="wf-card wf-row"><div class="wf-img" style="min-height:28px;width:34px"></div><div class="wf-t" style="flex:1;gap:4px"><div class="wf-l" style="width:72%"></div><div class="wf-l" style="width:45%"></div></div></div>
    <div class="wf-card wf-row wf-mut"><span style="font-size:9px">🔒</span><div class="wf-l" style="flex:1"></div></div>
  </div>
  <div class="wf-tb"><div><span class="ic"></span><span>Tableau</span></div><div class="on"><span class="ic"></span><span>Matières</span></div><div><span class="ic"></span><span>Param.</span></div></div>
</div>
<div class="wf-cap">Matières</div>
</div>

<div>
<div class="wf-phone">
  <div class="wf-notch"><i></i></div>
  <div class="wf-body" style="padding:8px;gap:7px">
    <div class="wf-bc">‹ retour</div>
    <div class="wf-img" style="min-height:42px"></div>
    <div class="wf-h" style="width:62%"></div>
    <div class="wf-row"><span class="wf-c">58%</span><span class="wf-c">4 chap.</span></div>
    <div class="wf-card wf-row"><span class="wf-ic"></span><div class="wf-l" style="flex:1"></div></div>
    <div class="wf-card wf-row wf-mut"><span style="font-size:9px">🔒</span><div class="wf-l" style="flex:1"></div></div>
  </div>
</div>
<div class="wf-cap">Programme</div>
</div>

<div>
<div class="wf-phone">
  <div class="wf-notch"><i></i></div>
  <div class="wf-body" style="padding:8px;gap:7px">
    <div class="wf-bc">‹ retour</div>
    <div class="wf-img vid" style="min-height:54px"></div>
    <div class="wf-row"><div class="wf-pg" style="flex:1"><i style="width:62%"></i></div><span style="font-size:7px;color:#7bd0ff">62%</span></div>
    <div class="wf-card"><div class="wf-lab" style="color:#7bd0ff;font-size:7px">⏱ Temps certifié</div></div>
    <button class="wf-b bl">Sommaire ▾</button>
  </div>
</div>
<div class="wf-cap">Lecteur + sommaire</div>
</div>

</div>

<!--
Et les mêmes écrans côté mobile, au format 393×852, en navigation par onglets. Vous retrouvez le dashboard, les matières avec recherche, le programme d'une formation avec son gating, et le lecteur avec son sommaire et son temps certifié. On insiste : ce ne sont pas deux conceptions distinctes, c'est la même pensée déclinée sur deux supports — ce qui réduit fortement le coût de maintenance.
-->

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

<!--
Le modèle conceptuel. La hiérarchie descend d'école vers classe et matière, puis matière → chapitre → vidéos et contenus. Deux associations many-to-many qu'on souligne : un utilisateur peut être rattaché à plusieurs écoles — via user_school — et une classe suit plusieurs matières — via classroom_subject. Enfin la progression est mesurée à deux niveaux : video_progress par vidéo, et chapter_progress par chapitre. On peut mentionner ici un point de modélisation qu'on a identifié et tracé dans la roadmap : le contenu réellement affiché aux élèves est un ChapterContent, alors que la progression est indexée sur Video — relier proprement les deux est le prochain chantier backend.
-->

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

<!--
Le passage au modèle physique. Les clés primaires en bigint auto-incrémentées, les clés étrangères matérialisées — school_id, classroom_id, teacher_id — et des contraintes qu'on a posées explicitement : un slug unique sur les écoles, un index unique composite sur l'ordre des chapitres. On veut attirer l'attention sur video_progress : la colonne watched_seconds_validated, c'est le temps validé côté serveur — le mot « validated » est important, il dit que cette valeur n'est jamais acceptée telle quelle depuis le client. Les SoftDeletes sont actifs sur les entités métier pour ne jamais perdre l'historique.
-->

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

<!--
Le diagramme de cas d'utilisation synthétise qui fait quoi. L'admin et l'école gèrent la structure et les utilisateurs ; le formateur crée les contenus et suit la progression de ses élèves ; l'élève consulte ses cours, visionne en temps certifié et consulte sa progression. Chaque cas se traduit, dans le code, par une opération ApiResource protégée par une Gate. Le cas le plus significatif — celui qu'on détaille juste après — est « visionner une vidéo en temps certifié », car c'est lui qui porte toute la logique anti-fraude.
-->

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

<!--
Voici le diagramme de séquence du cas anti-triche, à lire pas à pas. Premier temps : le client demande une session de visionnage pour un segment ; le serveur vérifie d'abord la Gate videos.view, puis génère un token via le WatchTokenService et dépose un nonce « en attente » dans Redis avec un TTL court. Le client reçoit un token signé HMAC, borné dans le temps. Deuxième temps : après environ 30 secondes de lecture, le client renvoie le token en heartbeat. Le serveur valide la signature, vérifie la fenêtre temporelle, et consulte l'état du nonce. Si la clé est valide, il consomme le nonce — passage à « used » — et crédite le temps dans VideoProgress, borné à la durée réelle de la vidéo. Sinon, 422 : que ce soit un rejeu, une soumission trop tôt, une clé expirée ou une signature altérée. C'est la pièce maîtresse de notre conception, et on va maintenant montrer comment elle est implémentée. On passe aux réalisations.
-->

