---
layout: section
transition: slide-left
---

# 2 · Conception
<div class="text-base opacity-70 mt-2">Architecture · MCD · Classes · Cas d'utilisation · Séquence · Maquettes</div>

<!--
On passe à la conception. C'est la phase qui précède tout développement — c'est ici qu'on prend les décisions d'architecture qui conditionnent la qualité du code.

On va couvrir : la stack technique, le MCD, le diagramme de classes, le diagramme de cas d'utilisation, le diagramme de séquence du heartbeat, et les maquettes.
-->

---
layout: default
---

# Architecture globale

<div class="grid grid-cols-3 gap-4 mt-2 text-sm">

<div class="mm-card" style="border-color:#7bd0ff">
<b style="color:#7bd0ff">Backend</b><br>
Laravel 12 · API Platform 4<br>
MariaDB · Redis · Sanctum<br>
<span class="text-xs opacity-60">→ API REST + doc OpenAPI auto</span>
</div>

<div class="mm-card" style="border-color:#c084fc">
<b style="color:#c084fc">Frontend Web</b><br>
Angular 21 · Zod · TailwindCSS<br>
<span class="text-xs opacity-60">→ SPA consomme l'API</span>
</div>

<div class="mm-card" style="border-color:#34d399">
<b style="color:#34d399">Mobile</b><br>
Expo / React Native<br>
expo-video · expo-secure-store<br>
<span class="text-xs opacity-60">→ même API, même logique</span>
</div>

</div>

<div class="mm-card mt-4 text-xs" style="border-color:#fbbf24">
<b>Monorepo GitHub</b> — un seul dépôt, trois projets, un Docker Compose. API Platform génère la documentation OpenAPI automatiquement.
</div>

<!--
La stack est organisée en trois couches indépendantes qui partagent une seule API.

Laravel + API Platform génère automatiquement les endpoints CRUD et la documentation Swagger. Angular côté web pour la rigueur du typage TypeScript. Expo pour le mobile — iOS et Android depuis une seule base de code React Native.

Redis sert spécifiquement au système anti-triche : les nonces des tokens de visionnage y sont stockés avec un TTL précis.
-->

---
layout: default
---

# MCD — Modèle Conceptuel de Données

<img src="./diagrams/mcd.svg" class="mx-auto mt-2" style="max-height: 380px; object-fit: contain" />

<div class="text-xs opacity-60 mt-2 text-center">Entités : rectangles · Cardinalités sur les liens · MCD = modèle métier pur, sans FK ni types SQL</div>

<!--
Le MCD représente les entités métier et leurs associations, sans se préoccuper de l'implémentation.

La hiérarchie pédagogique est linéaire : School → Classroom → Subject → Chapter → Video. Les deux relations N-N sont importantes : classroom_subject permet à une matière d'être enseignée dans plusieurs classes. Et user_school permet à un formateur de travailler dans plusieurs établissements.

VideoProgress relie User et Video : un élève peut avoir plusieurs progressions, une par vidéo visitée.

La différence avec le MPD : ici pas de clés étrangères ni de types SQL — c'est le modèle métier pur. Le MPD ajoute les FK, les index, les types de données SQL.
-->

---
layout: default
---

# Diagramme de classes

<img src="./diagrams/classes.svg" class="mx-auto mt-1" style="max-height: 340px; object-fit: contain" />

<div class="grid grid-cols-3 gap-2 text-xs mt-2">
  <div class="mm-card">◆ <b>Composition</b> — l'enfant ne vit pas sans le parent</div>
  <div class="mm-card">◇ <b>Agrégation</b> — l'enfant peut exister seul</div>
  <div class="mm-card">→ <b>Association</b> — entités indépendantes reliées</div>
</div>

<!--
Le diagramme de classes traduit le MCD en structure orientée objet.

La composition — losange plein — entre School et Classroom signifie qu'une Classroom ne peut pas exister sans son School. Même chose pour Subject, Chapter et Video. Dans le code, ça se traduit par des SoftDeletes.

L'agrégation — losange vide — entre Classroom et Subject : une matière peut exister sans être attachée à une classe. C'est la table pivot classroom_subject.

La simple association flèche entre User, VideoProgress et Video : la progression est une entité indépendante qui relie l'élève à la vidéo.
-->

---
layout: default
---

# Diagramme de cas d'utilisation

<img src="./diagrams/usecase.svg" class="mx-auto mt-2" style="max-height: 400px; object-fit: contain" />

<!--
Le diagramme de cas d'utilisation répond à "qui fait quoi" sans entrer dans le comment.

Trois acteurs : Admin, Formateur, Élève. Les ellipses représentent les cas d'utilisation — les fonctionnalités accessibles depuis l'extérieur du système.

Les liens «include» en pointillés sont des dépendances obligatoires. Visionner une vidéo inclut systématiquement s'authentifier. Et visionner une vidéo inclut l'obtention d'un token heartbeat — le mécanisme anti-triche déclenché automatiquement.

Si on avait une fonctionnalité optionnelle — "afficher bannière hors-ligne" seulement si le réseau est coupé — on utiliserait «extend» au lieu d'«include».
-->

---
layout: default
---

# Diagramme de séquence — Authentification

<img src="./diagrams/sequence.svg" class="mx-auto mt-2" style="max-height: 420px; object-fit: contain" />

<!--
Le diagramme de séquence représente les interactions dans le temps pour un scénario précis. Ici l'authentification — le scénario de base commun à tous les rôles.

Les flèches pleines sont des messages synchrones : le client attend la réponse avant de continuer. Les flèches pointillées sont les messages de retour.

L'API interroge la base pour trouver l'utilisateur par email. Elle vérifie ensuite le mot de passe avec un hash bcrypt — jamais en clair en base. Si les credentials sont valides, elle insère un token Sanctum dans la table personal_access_tokens et le retourne. Le client le stocke localement — localStorage côté web, SecureStore côté mobile.

Le fragment alt/else représente le branchement conditionnel : credentials invalides → 401, credentials valides → 200 avec token.
-->

---
layout: default
---

# Diagramme de séquence — Heartbeat anti-triche

<img src="./diagrams/sequence_anticheat.svg" class="mx-auto mt-2" style="max-height: 420px; object-fit: contain" />

<!--
Second diagramme de séquence sur le cas le plus original du projet : le heartbeat anti-triche.

Avant de visionner, le client demande un token signé HMAC-SHA256 avec un nonce stocké dans Redis. Après les 30 secondes de visionnage réel, il envoie le heartbeat.

Le serveur vérifie en cascade : la signature cryptographique, la disponibilité du nonce dans Redis, et la fenêtre temporelle. Si tout est valide, le nonce passe à "used" — anti-replay — et les secondes sont créditées en base. Sinon, 422 avec un motif précis.

Ce qui fait la robustesse du système : chaque vérification est indépendante et on ne peut pas sauter une étape.
-->

---
layout: default
---

# Maquettes & UserFlow

<div class="grid grid-cols-3 gap-3 mt-2 text-xs">

<div class="mm-card" style="border-color:#f87171">
<b style="color:#f87171">Admin</b><br>
Dashboard → gestion écoles → classes → utilisateurs → matières
</div>

<div class="mm-card" style="border-color:#c084fc">
<b style="color:#c084fc">Formateur</b><br>
Mes matières → dépôt vidéo → suivi élèves par matière
</div>

<div class="mm-card" style="border-color:#34d399">
<b style="color:#34d399">Élève</b><br>
Mes formations → chapitre → lecteur vidéo → progression
</div>

</div>

<div class="mm-card mt-4 text-sm">
<b>Principes UX :</b> navigation linéaire pour l'élève, vitesse vidéo verrouillée à 1x sur mobile, progression visible à chaque niveau de la hiérarchie.
</div>

<!--
Les maquettes ont été réalisées avant le développement pour valider le userflow.

Trois parcours distincts selon le rôle. L'administrateur configure la structure. Le formateur dépose ses vidéos et consulte la progression via la vue agrégée. L'élève suit un parcours linéaire avec navigation prev/next, vitesse verrouillée à 1x.

Ce qu'on a appris : anticiper les besoins en données dès la conception. Quand on a dessiné la vue formateur, on a réalisé qu'il fallait un endpoint agrégé spécifique — ce qui a influencé le schéma de BDD dès le début.
-->
