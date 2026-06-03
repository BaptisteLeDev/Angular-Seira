---
layout: section
---

# 2 · Conception
<div class="text-base opacity-70 mt-2">Architecture · BDD · UML · Maquettes</div>

<!--
On passe à la conception. C'est la phase qui précède tout développement — c'est ici qu'on prend les décisions d'architecture qui vont conditionner la qualité du code pendant des mois.

On va couvrir quatre points. D'abord le choix de la stack technique et les raisons derrière chaque technologie. Ensuite le schéma de base de données avec ses 8 modèles. Puis les diagrammes UML, notamment le diagramme de séquence du système anti-triche qui est le plus important techniquement. Et enfin les maquettes et le userflow par rôle.

C'est une partie importante du dossier CDA — elle montre qu'on a réfléchi avant de coder.
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

On a choisi Laravel pour le backend car c'est le framework PHP le plus robuste pour une API REST, surtout combiné à API Platform qui génère automatiquement les endpoints CRUD et la documentation Swagger à partir des attributs PHP sur les modèles. On n'écrit pas de routes à la main pour les opérations standard.

Angular côté web pour la rigueur du typage TypeScript. Et Expo pour le mobile, qui permet de cibler iOS et Android avec une seule base de code React Native.

Le tout dans un monorepo GitHub : un seul `docker compose up` lance le backend, MariaDB, Redis, et phpMyAdmin.

Redis sert spécifiquement au système anti-triche : les nonces des tokens de visionnage y sont stockés avec un TTL précis. On y revient dans les réalisations.
-->

---
layout: default
---

# Modèle de données

<div class="grid grid-cols-2 gap-4 mt-3 text-xs">

<div class="mm-card">
<b style="color:#7bd0ff">Hiérarchie pédagogique</b><br>
School → Classroom → Subject → Chapter → Video<br><br>
<b style="color:#c084fc">Pivots N-N</b><br>
user_school — formateurs dans plusieurs écoles<br>
classroom_subject — matières dans plusieurs classes
</div>

<div class="mm-card">
<b style="color:#34d399">Suivi certifié</b><br>
VideoProgress — <code>watched_seconds_validated</code><br>
modifiable uniquement via heartbeat<br><br>
<b style="color:#fbbf24">Intégrité</b><br>
SoftDeletes sur toutes les entités sensibles
</div>

</div>

<!--
La base de données compte 8 modèles principaux.

La hiérarchie pédagogique est stricte : une école a des classes, une classe suit des matières, une matière a des chapitres, un chapitre a des vidéos. Cette structure reflète exactement la réalité terrain.

Les tables pivots sont importantes. La table classroom_subject permet à une matière d'être dispensée dans plusieurs classes. La table user_school permet à un formateur de travailler dans plusieurs établissements — c'est une contrainte métier réelle qu'on a traitée avec une API dédiée.

Point clé sur VideoProgress : le champ watched_seconds_validated n'est jamais modifiable directement via l'API REST normale. Le seul chemin pour l'incrémenter passe par le système de heartbeat. C'est une décision d'architecture, pas juste une règle de validation.

SoftDelete sur toutes les entités sensibles : un admin qui supprime une matière ne détruit pas les données de progression des élèves.
-->

---
layout: two-cols
layoutClass: gap-8
---

# Diagrammes UML

### Cas d'utilisation

<div class="text-xs flex flex-col gap-2 mt-2">
  <div class="mm-card"><b style="color:#f87171">Admin</b> → gère école, classes, matières, utilisateurs</div>
  <div class="mm-card"><b style="color:#c084fc">Formateur</b> → dépose vidéos, suit ses élèves</div>
  <div class="mm-card"><b style="color:#34d399">Élève</b> → visionne, progresse, est certifié</div>
</div>

::right::

### Séquence — heartbeat anti-triche

<div class="text-xs flex flex-col gap-1 mt-2">
  <div class="mm-card">1. Client → <code>POST /watch-sessions/request</code></div>
  <div class="mm-card">2. Serveur génère token HMAC + nonce Redis</div>
  <div class="mm-card">3. Client visionne 30 secondes réelles</div>
  <div class="mm-card">4. Client → <code>POST /watch-sessions/heartbeat</code></div>
  <div class="mm-card">5. Serveur valide signature + timing + nonce</div>
  <div class="mm-card">6. Serveur crédite les secondes validées</div>
</div>

<!--
On veut s'arrêter sur le diagramme de séquence du heartbeat car c'est le morceau le plus original techniquement.

Avant de commencer à regarder une vidéo, le client demande un token au serveur. Ce token est signé avec HMAC-SHA256 et contient l'identifiant utilisateur, l'identifiant vidéo, les bornes du segment de 30 secondes, et le timestamp d'émission.

Un nonce — un identifiant unique à usage unique — est stocké dans Redis avec une durée de vie précise.

Le client regarde réellement les 30 secondes.

Le client envoie le token au serveur.

Le serveur vérifie trois choses : la signature HMAC pour s'assurer que le token n'a pas été falsifié, le timing pour s'assurer que le heartbeat n'est pas soumis trop tôt ou trop tard, et le nonce pour empêcher de soumettre le même token deux fois — ce qu'on appelle le replay.

Seulement si tout est valide, le serveur crédite les secondes dans VideoProgress.

C'est cette mécanique qui rend le suivi certifié.
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

Trois parcours distincts selon le rôle.

Pour l'administrateur : un outil de configuration. Il crée des structures, assigne des personnes. L'interface est dense, orientée gestion.

Pour le formateur : il dépose ses vidéos, organise leur ordre, et consulte la progression de ses élèves. La vue agrégée lui donne en un coup d'œil le taux de complétion par élève sur chacune de ses matières.

Pour l'élève : le parcours est volontairement linéaire. Il navigue chapitre par chapitre avec des boutons prev/next. Sur mobile, la vitesse est verrouillée à 1x.

Ce qu'on a appris de cette phase maquettage : anticiper les besoins en données dès la conception. Quand on a dessiné la vue formateur, on a réalisé qu'il fallait un endpoint agrégé spécifique — pas juste des VideoProgress bruts, mais déjà regroupés par matière et par élève. Ce qui a influencé le schéma de BDD dès le début.
-->
