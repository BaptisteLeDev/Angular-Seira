---
layout: section
transition: slide-left
---

# 📱 App Mobile
<div class="text-base opacity-70 mt-2">Expo · expo-router · zustand · uniwind</div>

---

# Mobile — état des lieux

<div class="grid grid-cols-2 gap-8 mt-2">

<div>

### ✅ Déjà en place

- **Auth Sanctum** + `expo-secure-store`
- **RoleGate** / `use-role-guard`
- Parcours matières → cours → vidéos
- **VideoPlayer** (`expo-video`) avancé :
  - lecture active (`isPlaying`)
  - vitesse **verrouillée à 1x**
  - anti-seek

</div>

<div>

### 🔲 À construire

<div class="flex flex-col gap-2 text-sm">
  <div class="mm-card">#25 · Anti-triche : <b>envoi</b> des clés au serveur <span class="mm-chip mm-chip-todo">P-high</span></div>
  <div class="mm-card">#26 · Écran <b>Classes</b> (parcours complet)</div>
</div>

<div class="mm-card mt-3 text-xs" style="border-color:#34d399">
Le lecteur mobile est déjà plus strict que le web : il ne manque que la <b>remontée serveur</b>.
</div>

</div>

</div>

---
layout: section
transition: slide-up
---

# #25 · Anti-triche mobile
<div class="text-base opacity-70 mt-2">Brancher le lecteur existant sur les clés serveur</div>

---

# #25 · Déjà fait vs manquant

<div class="grid grid-cols-2 gap-6 mt-4">

<div class="mm-card" style="border-color:#34d399">
<b style="color:#34d399">✅ Déjà géré côté client</b>
<ul class="text-sm mt-2">
<li><code>currentTime</code> capté (<code>timeUpdate</code>, 0.5s)</li>
<li>Lecture active détectée</li>
<li>Vitesse verrouillée 1x · anti-seek</li>
</ul>
</div>

<div class="mm-card" style="border-color:#fbbf24">
<b style="color:#fbbf24">🔲 Manquant</b>
<ul class="text-sm mt-2">
<li>Aucun envoi au serveur</li>
<li>Pas de store de progression</li>
<li>Réception / renvoi des clés segment</li>
<li>Edge case : plein écran natif</li>
</ul>
</div>

</div>

<div class="mm-card mt-4 text-sm" style="border-color:#7bd0ff">
<b style="color:#7bd0ff">En tant qu'</b>élève mobile, <b>je veux</b> que mon visionnage compte comme sur le web, <b>afin d'</b>avoir une progression unifiée.
</div>

---

# #25 · Séquence mobile

```mermaid {scale: 0.64}
sequenceDiagram
  autonumber
  participant P as VideoPlayer (expo-video)
  participant Z as progress.store (zustand)
  participant API as API Laravel

  P->>API: POST /videos/:id/viewing-sessions
  API-->>Z: session_token (persisté)
  loop timeUpdate (segment franchi)
    P->>Z: onSegment(n)
    Z->>API: GET next-key (n)
    API-->>Z: { key, expires_at }
    Z->>API: POST validate { key, n }
    API-->>Z: watched_seconds_validated
    Z->>P: maj UI progression
  end
  Note over P,API: même contrat que le web → API mutualisée
```

---
layout: two-cols
layoutClass: gap-8
---

# #26 · Écran Classes

Le parcours matières → cours → vidéos fonctionne, mais l'écran **Classes** manque : `classroom.api.ts` existe mais n'est pas branché.

<div class="text-sm flex flex-col gap-2 mt-4">
<div class="mm-card">
<b style="color:#7bd0ff">User story</b><br>
En tant qu'élève, je veux choisir ma classe puis accéder à ses matières.
</div>
</div>

::right::

```mermaid {scale: 0.62}
flowchart TD
  T["(app) Tabs"] --> CL["app/(app)/classes"]
  CL -->|"classroom.api + store"| LIST["Liste des classes"]
  LIST --> SUB["formations/[id]"]
  SUB --> ART["formations/[id]/[articleId]"]
```

<div class="text-xs opacity-60 mt-2">
Nouvel écran expo-router + store dédié, garde <code>RoleGate('student')</code>.
</div>

---

# Mobile — récap & dépendances

| Issue | Sujet | Dépend de |
|-------|-------|-----------|
| **#25** | Anti-triche · envoi des clés | Backend **#18** |
| **#26** | Écran Classes | — |

<div class="mm-card mt-6" style="border-color:#34d399">
<b style="color:#34d399">Avantage :</b> contrat d'API identique au web → l'effort #25 est surtout du <b>branchement store ↔ API</b>, la logique de lecture étant déjà là.
</div>
