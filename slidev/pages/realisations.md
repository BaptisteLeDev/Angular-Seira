---
layout: section
---

# 3 · Réalisations
<div class="text-base opacity-70 mt-2">Backend · Frontend Web · Mobile</div>

<!--
On passe aux réalisations — c'est la partie la plus longue de la présentation, environ 12 minutes.

On va couvrir les trois couches dans l'ordre logique : le backend d'abord, parce qu'il conditionne tout le reste. Ensuite le frontend Angular. Et enfin l'application mobile Expo.

Pour le backend, on ne va pas tout parcourir en détail — on se concentre sur les trois points les plus significatifs : l'architecture API Platform avec le contrôle d'accès, le système anti-triche qui est le coeur du projet, et les vues agrégées qui répondent au besoin formateur.
-->

---
layout: default
---

# Backend — API & RBAC

<div class="grid grid-cols-2 gap-4 mt-2 text-sm">

<div class="mm-card">
<b style="color:#7bd0ff">API Platform + Eloquent</b>
<ul class="text-xs mt-1">
<li>8 modèles <code>#[ApiResource]</code> → endpoints générés</li>
<li>Documentation Swagger sur <code>/api/docs</code></li>
<li>State Processors pour la logique métier</li>
<li>Providers pour les collections filtrées</li>
</ul>
</div>

<div class="mm-card">
<b style="color:#f87171">RBAC — 30+ Gates Laravel</b>
<ul class="text-xs mt-1">
<li>3 rôles : admin · teacher · student</li>
<li>Isolation par school_id / classroom_id</li>
<li>Chaque opération a sa gate dédiée</li>
<li>Ex : un élève ne voit que ses VideoProgress</li>
</ul>
</div>

</div>

<!--
Le backend c'est le cœur du projet.

API Platform nous fait gagner énormément de temps : on déclare un modèle Eloquent avec l'attribut ApiResource, et tous les endpoints CRUD sont générés automatiquement avec leur documentation Swagger. On n'écrit pas de routes à la main pour les opérations standard.

Pour la logique métier complexe, on utilise des State Processors. Par exemple, quand un élève crée un enregistrement de progression vidéo, le processor vérifie que la vidéo existe, qu'il n'y a pas déjà un doublon pour cette paire utilisateur-vidéo, et force watched_seconds à zéro. Le client ne peut pas le définir lui-même.

Le contrôle d'accès est géré par plus de 30 Gates Laravel. Chaque opération a sa gate. Un admin peut tout voir. Un formateur ne voit que ses matières. Un élève ne voit que ses propres données. Isolation stricte.
-->

---
layout: default
---

# Backend — Système anti-triche

<div class="grid grid-cols-2 gap-4 mt-2 text-xs">

<div class="mm-card" style="border-color:#f87171">
<b style="color:#f87171">POST /api/watch-sessions/request</b><br>
→ vérifie accès (gate videos.view)<br>
→ génère token HMAC-SHA256<br>
→ stocke nonce dans Redis (TTL segment)<br>
→ retourne token + bornes + expires_at
</div>

<div class="mm-card" style="border-color:#34d399">
<b style="color:#34d399">POST /api/watch-sessions/heartbeat</b><br>
→ vérifie signature HMAC<br>
→ vérifie fenêtre temporelle (±5s / +60s)<br>
→ consomme le nonce (anti-replay)<br>
→ crédite watched_seconds_validated
</div>

</div>

<div class="mm-card mt-3 text-xs" style="border-color:#fbbf24">
Impossible de simuler du temps de visionnage sans recevoir un token valide et attendre réellement la durée du segment.
</div>

<!--
Le système anti-triche, c'est la réalisation dont on est le plus satisfaits.

L'endpoint request émet un token signé. Ce token encode l'utilisateur, la vidéo, les bornes du segment de 30 secondes, et le moment d'émission. Il est signé avec la clé secrète de l'application via HMAC-SHA256. Un nonce aléatoire est stocké dans Redis avec une durée de vie précise.

L'endpoint heartbeat reçoit ce token. Il vérifie trois choses : la signature cryptographique — si quelqu'un a modifié un octet, la vérification échoue. Le timing — le heartbeat ne peut être soumis ni trop tôt ni trop tard. Et le nonce — il est consommé après le premier heartbeat, ce qui empêche le replay.

Seulement si tout est valide, le serveur crédite les secondes dans VideoProgress.
-->

---
layout: default
---

# Backend — Vues agrégées & multi-école

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">

<div class="mm-card">
<b style="color:#c084fc">GET /api/aggregates/teacher</b><br>
<span class="text-xs">Progression de chaque élève par matière<br>
→ vidéos vues, secondes validées, % complétion</span>
</div>

<div class="mm-card">
<b style="color:#34d399">GET /api/aggregates/school</b><br>
<span class="text-xs">Vue globale par classe pour l'admin<br>
→ tous les élèves × toutes les matières</span>
</div>

</div>

<div class="mm-card mt-3 text-xs" style="border-color:#7bd0ff">
<b>Multi-école :</b> table pivot user_school — un formateur peut enseigner dans plusieurs écoles. Un élève ne peut avoir qu'une école à la fois (transfert automatique, classroom effacée).
</div>

<!--
Deux endpoints agrégés répondent au besoin de suivi pédagogique.

L'endpoint teacher donne au formateur une vue complète. En une requête, il voit pour chaque élève : vidéos vues, secondes validées, et pourcentage de complétion calculé sur la durée totale des vidéos.

L'endpoint school est la vue globale pour l'administrateur.

Performance : on charge toutes les VideoProgress en une seule requête SQL, puis on agrège en PHP. Ça évite le N+1 — sans ça, une école avec 100 élèves et 50 vidéos ferait 5000 requêtes. Là, c'est une seule.

Sur le multi-école : un formateur peut être dans plusieurs écoles simultanément. Un élève peut changer d'école — le transfert est automatique et l'ancienne classe est effacée.
-->

---
layout: default
---

# Frontend Web — Angular

<div class="grid grid-cols-2 gap-4 mt-2 text-sm">

<div class="mm-card">
<b style="color:#c084fc">Architecture</b>
<ul class="text-xs mt-1">
<li>Routing protégé par guards par rôle</li>
<li>Schémas Zod pour valider les réponses API</li>
<li>Services dédiés par domaine</li>
<li>PDF viewer pour les référentiels</li>
</ul>
</div>

<div class="mm-card">
<b style="color:#7bd0ff">Interfaces par rôle</b>
<ul class="text-xs mt-1">
<li>Admin : gestion école, classes, utilisateurs</li>
<li>Formateur : mes matières, mes élèves</li>
<li>Élève : formations → chapitres → vidéos</li>
<li>Navigation prev/next entre articles</li>
</ul>
</div>

</div>

<!--
Le frontend web est une Single Page Application Angular 21.

Le routing est protégé par des guards qui vérifient le rôle. Un élève qui tenterait d'accéder à /admin serait redirigé immédiatement.

On utilise Zod pour valider les réponses de l'API. Ça peut paraître défensif, mais ça nous a sauvé plusieurs fois — quand le backend retourne un format inattendu, Zod plante proprement avec un message d'erreur lisible.

Un point fonctionnel intéressant : le viewer de PDF pour les référentiels pédagogiques. Chaque matière peut avoir un document de référence consultable directement dans le navigateur.
-->

---
layout: default
---

# Mobile — Expo / React Native

<div class="grid grid-cols-2 gap-4 mt-2 text-sm">

<div class="mm-card">
<b style="color:#34d399">Lecteur vidéo contrôlé</b>
<ul class="text-xs mt-1">
<li>expo-video — vitesse verrouillée à 1x</li>
<li>Détection lecture active (isPlaying)</li>
<li>Anti-seek : retour arrière limité</li>
<li>Bannière hors-ligne (NetInfo)</li>
</ul>
</div>

<div class="mm-card">
<b style="color:#7bd0ff">Auth & navigation</b>
<ul class="text-xs mt-1">
<li>Token Sanctum dans expo-secure-store</li>
<li>RoleGate — redirections par rôle</li>
<li>Guard use-role-guard sur chaque écran</li>
</ul>
</div>

</div>

<!--
L'application mobile est construite avec Expo — iOS et Android depuis une seule base de code TypeScript.

Le lecteur vidéo est la pièce centrale. Vitesse verrouillée à 1x, détection de la lecture active, anti-seek. On a aussi une bannière hors-ligne qui prévient l'utilisateur quand sa connexion est perdue.

L'authentification utilise expo-secure-store pour stocker le token dans le keychain du téléphone. Jamais en clair dans AsyncStorage.

Les écrans sont protégés par RoleGate et use-role-guard — un élève ne peut pas accéder aux écrans formateur.
-->
