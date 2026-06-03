---
layout: section
---

# 5 · Déploiement & DevOps
<div class="text-base opacity-70 mt-2">Docker · Git Flow · Vercel · EAS</div>

<!--
On passe au déploiement et au DevOps. C'est une partie qu'on veut traiter sérieusement, parce qu'un code qui ne se déploie pas proprement n'est pas livrable — même s'il est parfait localement.

On va couvrir deux aspects : d'abord l'environnement de développement avec Docker et le git flow qui structure notre collaboration. Ensuite le déploiement en production — Vercel pour le frontend Angular, EAS pour le mobile Expo, et Docker pour le backend.

Cette section correspond à la compétence "Préparer le déploiement" du titre CDA.
-->

---
layout: default
---

# Environnement & Docker

<div class="grid grid-cols-2 gap-4 mt-2 text-sm">

<div class="mm-card">
<b style="color:#7bd0ff">docker-compose.yml — 5 services</b>
<ul class="text-xs mt-1">
<li><b>php</b> — PHP-FPM 8.4 + extensions Laravel</li>
<li><b>nginx</b> — reverse proxy</li>
<li><b>mariadb</b> — base de données</li>
<li><b>redis</b> — cache nonces anti-triche</li>
<li><b>phpmyadmin</b> — administration BDD</li>
</ul>
</div>

<div class="mm-card">
<b style="color:#c084fc">Git Flow</b>
<ul class="text-xs mt-1">
<li>Branche <code>master</code> — production stable</li>
<li>Branche <code>dev</code> — intégration continue</li>
<li>Feature branches → Pull Request vers dev</li>
<li>Merge dev → master = release</li>
</ul>
</div>

</div>

<!--
L'environnement de développement est entièrement conteneurisé avec Docker Compose. Cinq services : PHP-FPM, Nginx comme reverse proxy, MariaDB, Redis pour l'anti-triche, et phpMyAdmin.

Un développeur qui rejoint le projet fait un git clone, configure son .env depuis le .env.example, et docker compose up. L'environnement complet est opérationnel en deux à trois minutes. Pas besoin d'installer PHP, MariaDB, ou Redis en local.

Le git flow est classique : une branche master pour la production stable, une branche dev pour l'intégration, et des feature branches pour chaque lot. Chaque fonctionnalité est développée sur sa propre branche, puis intégrée via Pull Request sur dev. Quand dev est stable et les tests passent, on merge sur master.

Ce workflow garantit que master est toujours dans un état déployable.
-->

---
layout: default
---

# Déploiement continu

<div class="grid grid-cols-2 gap-4 mt-2 text-sm">

<div class="mm-card" style="border-color:#c084fc">
<b style="color:#c084fc">Frontend Angular</b><br>
Déployé sur <b>Vercel</b><br>
CD automatique à chaque push sur master<br>
Preview deployments sur les Pull Requests
</div>

<div class="mm-card" style="border-color:#34d399">
<b style="color:#34d399">Mobile Expo</b><br>
Build via <b>EAS</b> (Expo Application Services)<br>
Distribution TestFlight iOS / APK Android
</div>

</div>

<div class="mm-card mt-4 text-xs" style="border-color:#7bd0ff">
<b>Backend :</b> déployable sur tout VPS avec Docker. Aucun secret dans le code — toutes les variables sensibles passent par le fichier .env.
</div>

<!--
Le frontend Angular est déployé sur Vercel. À chaque push sur master, Vercel déclenche automatiquement un build et un déploiement. Les Pull Requests ont leurs propres preview deployments — on peut tester une fonctionnalité dans un environnement de staging avant de merger.

Le mobile Expo utilise EAS pour les builds. On génère un IPA pour iOS et un APK pour Android depuis la même commande. Distribution via TestFlight pour les testeurs iOS.

Le backend peut être déployé sur n'importe quel VPS qui supporte Docker. Les variables d'environnement — clés secrètes, credentials base de données, configuration Redis — sont externalisées dans un fichier .env qui n'est jamais versionné. Aucun secret dans le code, c'est une règle non négociable.
-->
