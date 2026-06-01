---
layout: section
transition: slide-left
---

# 🌐 App Web
<div class="text-base opacity-70 mt-2">Angular 21 · signals · stores réactifs · Tailwind v4</div>

---

# Web — état des lieux

<div class="grid grid-cols-2 gap-8 mt-2">

<div>

### ✅ Déjà en place

- Routes lazy + `authGuard` / `roleGuard`
- Stores **signals** par domaine (auth, formation…)
- Espaces **teacher** & **admin**
- Parcours matières → cours → vidéos
- Lecteur `<video>` HTML5 de base

</div>

<div>

### 🔲 À construire

<div class="flex flex-col gap-2 text-sm">
  <div class="mm-card">#22 · Lecteur vidéo <b>contrôlé</b> anti-triche <span class="mm-chip mm-chip-todo">P-high</span></div>
  <div class="mm-card">#23 · Espace élève + classes attribuées</div>
  <div class="mm-card">#24 · Dashboards formateur & école</div>
</div>

<div class="mm-card mt-3 text-xs" style="border-color:#818cf8">
Dépend de #18 (clés) et #15 (agrégation progression).
</div>

</div>

</div>

---
layout: section
transition: slide-up
---

# #22 · Lecteur contrôlé
<div class="text-base opacity-70 mt-2">L'anti-triche, côté navigateur</div>

---

# #22 · User stories & userflow

<div class="grid grid-cols-2 gap-6 mt-2">

<div class="text-sm flex flex-col gap-3">
<div class="mm-card">
<b style="color:#7bd0ff">En tant qu'</b>élève,
<b>je veux</b> que mon temps se valide quand je regarde vraiment,
<b>afin que</b> ma progression soit juste.
</div>
<div class="mm-card">
<b style="color:#c084fc">En tant que</b> plateforme,
<b>je veux</b> suspendre le crédit si l'onglet est masqué ou la vitesse > 2x.
</div>
</div>

<div>

```mermaid {scale: 0.58}
flowchart TD
  A["Ouvre le cours"] --> B["Charge la vidéo"]
  B --> C["POST viewing-session"]
  C --> D{Lecture active ?}
  D -->|Oui| E["Demande clé segment n"]
  E --> F{"Onglet visible<br/>& vitesse ≤ 2x ?"}
  F -->|Oui| G["Valide segment → crédite"]
  F -->|Non| H["Suspend le crédit"]
  G --> D
  H --> D
  D -->|Fin vidéo| I["status = completed"]
```

</div>

</div>

---

# #22 · Machine à états du lecteur

```mermaid {scale: 0.6}
stateDiagram-v2
  [*] --> Idle
  Idle --> Playing : play()
  Playing --> Paused : pause()
  Paused --> Playing : play()
  Playing --> Hidden : visibilitychange (caché)
  Hidden --> Playing : visibilitychange (visible)
  Playing --> Invalid : rate > 2x
  Invalid --> Playing : rate ≤ 2x
  Playing --> Completed : fin de vidéo

  note right of Playing
    Seul cet état demande
    et valide des clés (crédit du temps)
  end note
  note right of Hidden
    Crédit suspendu
    (onglet en arrière-plan)
  end note
```

<div class="text-xs opacity-60 text-center mt-1">
Écouteurs : <code>play/pause/timeupdate/ratechange</code> + <code>document.visibilitychange</code>.
</div>

---

# #22 · Séquence client ↔ API

```mermaid {scale: 0.64}
sequenceDiagram
  autonumber
  participant V as VideoPlayer (Angular)
  participant S as ProgressStore (signal)
  participant API as API Laravel

  V->>API: POST /videos/:id/viewing-sessions
  API-->>V: session_token
  loop tick de lecture active (~10s)
    V->>V: check visibilité + playbackRate ≤ 2
    V->>API: GET next-key (segment n)
    API-->>V: { key, expires_at }
    V->>API: POST validate { key, n }
    API-->>S: watched_seconds_validated
    S->>V: maj barre de progression (signal)
  end
```

<div class="text-xs opacity-60 text-center mt-1">
Nouveau <code>core/api/progress.api.ts</code> + <code>ProgressStore</code> ; le Bearer est ajouté par <code>jwtInterceptor</code>.
</div>

---
layout: two-cols
layoutClass: gap-8
---

# #23 · Espace élève + classes

L'élève passe aujourd'hui par un dashboard générique. On crée un **espace dédié** et on affiche ses **classes attribuées**.

<div class="text-sm flex flex-col gap-2 mt-4">
<div class="mm-card">
<b style="color:#7bd0ff">User story</b><br>
En tant qu'élève, je veux voir mes classes et naviguer vers leurs matières.
</div>
</div>

::right::

```mermaid {scale: 0.6}
flowchart TD
  L["/login"] --> D["/student (dédié)"]
  D --> C["Mes classes<br/>(IRIs hydratés)"]
  C --> M["Matières de la classe"]
  M --> CO["Cours / chapitres"]
  CO --> VID["Vidéos + progression"]
```

<div class="text-xs opacity-60 mt-2">
Routes protégées par <code>roleGuard('student')</code>.
</div>

---

# #24 · Dashboards de suivi

<div class="grid grid-cols-2 gap-6 mt-2">

<div>

### User stories

<div class="text-sm flex flex-col gap-2">
<div class="mm-card"><b style="color:#c084fc">Formateur</b> — suivre chaque élève : temps, %, statut, avancement par matière.</div>
<div class="mm-card"><b style="color:#34d399">École</b> — vision globale agrégée (toutes classes).</div>
</div>

<div class="text-xs opacity-60 mt-3">Consomme l'agrégation backend (#15).</div>

</div>

<div>

### Maquette (layout)

<div class="mm-card text-xs font-mono leading-relaxed">
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

---

# Web — récap & dépendances

| Issue | Sujet | Dépend de |
|-------|-------|-----------|
| **#22** | Lecteur contrôlé anti-triche | Backend **#18** |
| **#23** | Espace élève + classes | — |
| **#24** | Dashboards formateur / école | Backend **#15** |

<div class="mm-card mt-6" style="border-color:#c084fc">
<b style="color:#c084fc">Note :</b> l'affichage de la progression élève est déjà cadré par l'épic <b>#16</b> ; #24 le prolonge côté encadrants.
</div>
