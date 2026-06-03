---
theme: seriph
title: MontoMaster — Dossier de projet CDA
info: |
  ## MontoMaster V2
  Présentation de projet — Titre professionnel Concepteur Développeur d'Applications.
  Plateforme e-learning, remplaçant de Seira.
author: Baptiste & Nicolas
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

Plateforme e-learning sécurisée — **remplaçant de Seira**

<div class="mt-6 text-base opacity-70">
Présentation de projet · Titre professionnel <b>Concepteur Développeur d'Applications</b>
</div>

<div class="mt-10 flex justify-center gap-3 text-xs">
  <span class="mm-chip" style="color:#7bd0ff">Laravel 12 · API Platform</span>
  <span class="mm-chip" style="color:#c084fc">Angular 21</span>
  <span class="mm-chip" style="color:#34d399">Expo / React Native</span>
</div>

<div class="abs-br m-6 text-xs opacity-50">
  Baptiste & Nicolas — Session CDA
</div>

<!--
Bonjour à tous. On est Baptiste et Nicolas, et on va vous présenter MontoMaster V2, une plateforme e-learning qu'on a conçue et développée dans le cadre de notre titre de Concepteur Développeur d'Applications.

L'idée de départ est simple : remplacer Seira, l'ancienne solution utilisée par des écoles de formation, par une plateforme moderne, sécurisée, et accessible depuis un navigateur ou un smartphone.

Ce qui rend ce projet particulier, c'est la notion de suivi certifié : on ne veut pas que les élèves puissent truquer leur temps de visionnage. C'est un défi technique concret, et c'est le fil conducteur de cette présentation.
-->

---
transition: fade-out
layout: two-cols
layoutClass: gap-12
---

# Plan de la présentation

<div class="mt-4 flex flex-col gap-2 text-sm">
  <div class="mm-card"><b style="color:#7bd0ff">1 · Besoins & gestion de projet</b></div>
  <div class="mm-card"><b style="color:#c084fc">2 · Conception</b> — archi, maquettes, BDD, UML</div>
  <div class="mm-card"><b style="color:#34d399">3 · Réalisations</b> — UI, métier, accès données, sécurité</div>
  <div class="mm-card"><b style="color:#fbbf24">4 · Plan de tests & jeu d'essai</b></div>
  <div class="mm-card"><b style="color:#f87171">5 · Déploiement & DevOps</b></div>
  <div class="mm-card"><b style="color:#818cf8">6 · Veille sécurité & conclusion</b></div>
</div>

::right::

<div class="mm-card mt-12 text-sm" style="border-color:#7bd0ff">
<b style="color:#7bd0ff">Le projet en une phrase</b><br>
Une plateforme pédagogique <b>écoles → classes → matières → chapitres → vidéos</b>, avec un <b>suivi de progression certifié anti-triche</b>, exposée par une API unique consommée par un <b>web</b> et un <b>mobile</b>.
</div>

<div class="mm-card mt-4 text-xs" style="border-color:#fbbf24">
🚫 Hors périmètre de cette session : la couche IA (transcription, RAG, chat).
</div>

<!--
On va structurer cette présentation en six parties, qui correspondent aux attendus du dossier CDA.

On commence par les besoins : d'où vient ce projet, qui l'utilise, et pourquoi il remplace l'existant.

Ensuite la conception : comment on a pensé l'architecture avant d'écrire une ligne de code — les diagrammes, la base de données, les maquettes.

Puis les réalisations concrètes : le backend en Laravel, le frontend Angular, l'application mobile Expo. On va montrer les points techniques les plus significatifs.

La partie tests : notre stratégie, et on va vous montrer le résultat — 127 tests automatisés, tous verts.

Déploiement : comment l'application tourne en production aujourd'hui.

Et on fermera sur une note de veille sécurité, parce que la sécurité n'est jamais accessoire dans une plateforme pédagogique.

Petite précision avant de démarrer : la couche IA est hors périmètre de cette session. Elle est spécifiée et documentée dans le dossier, mais non implémentée. On en parle rapidement en conclusion.
-->

---
layout: default
---

# Compétences du titre couvertes par le projet

<div class="grid grid-cols-3 gap-3 mt-2 text-xs">

<div class="mm-card" style="border-color:#7bd0ff">
<b style="color:#7bd0ff">Développer une appli sécurisée</b>
<ul class="mt-1">
<li>Installer/configurer l'environnement → <em>Docker, Vercel</em></li>
<li>Interfaces utilisateur → <em>Angular, Expo</em></li>
<li>Composants métier → <em>Processors, anti-triche</em></li>
<li>Gérer un projet informatique → <em>GitHub issues/PR</em></li>
</ul>
</div>

<div class="mm-card" style="border-color:#c084fc">
<b style="color:#c084fc">Concevoir & développer en couches</b>
<ul class="mt-1">
<li>Analyser & maquetter → <em>besoins, userflow</em></li>
<li>Architecture logicielle → <em>monorepo, API Platform</em></li>
<li>BDD relationnelle → <em>MCD/MPD, MariaDB</em></li>
<li>Accès données SQL & NoSQL → <em>Eloquent + Redis</em></li>
</ul>
</div>

<div class="mm-card" style="border-color:#34d399">
<b style="color:#34d399">Préparer le déploiement</b>
<ul class="mt-1">
<li>Plans de tests → <em>127 tests PHPUnit + Vitest</em></li>
<li>Documenter le déploiement → <em>Docker, Vercel</em></li>
<li>Mise en production DevOps → <em>git flow, CD Vercel</em></li>
</ul>
</div>

</div>

<div class="mm-card mt-4 text-xs" style="border-color:#fbbf24">
<b style="color:#fbbf24">Fil conducteur :</b> chaque compétence est démontrée sur une réalisation concrète, illustrée par un schéma, une capture ou un extrait de code dans les diapos qui suivent.
</div>

<!--
Cette diapo est importante : elle montre au jury que le projet couvre bien l'ensemble des compétences du titre.

Première colonne, développer une application sécurisée : on a l'authentification avec Sanctum, le contrôle d'accès par rôles, le système anti-triche, et l'environnement Docker reproductible.

Deuxième colonne, concevoir et développer en couches : on a fait l'analyse des besoins, les maquettes, la modélisation de la base de données en MCD et MPD, et l'accès aux données avec Eloquent pour le SQL et Redis pour le cache des tokens anti-triche.

Troisième colonne, préparer le déploiement : 127 tests PHPUnit plus une suite Vitest côté frontend, et un pipeline de déploiement continu sur Vercel.

On va démontrer chacune de ces compétences sur des réalisations concrètes dans les slides qui suivent.
-->

---
layout: section
transition: slide-left
---

# 1 · Besoins & gestion de projet
<div class="text-base opacity-70 mt-2">Analyser les besoins · Contribuer à la gestion d'un projet</div>

<!--
On attaque la première partie : les besoins et la gestion de projet.

C'est le point de départ de tout — si on ne comprend pas bien le problème, on risque de construire une bonne solution au mauvais problème. Ici on va vous expliquer pourquoi MontoMaster remplace Seira, qui sont les utilisateurs, et comment on a organisé le projet pour livrer dans les délais.

On va couvrir l'expression des besoins, les contraintes techniques, et notre méthode de travail avec GitHub.
-->

---
layout: default
---

# Expression des besoins

<div class="grid grid-cols-2 gap-8 mt-2">

<div>

### Contexte

Remplacer **Seira**, l'ancienne plateforme e-learning, par une solution **multi-écoles**, **multi-clients** (web + mobile) et surtout **anti-triche** sur le temps de visionnage.

### Objectifs

- Diffuser des **parcours pédagogiques** structurés
- **Certifier** le temps réellement visionné (≠ déclaratif)
- Offrir un **suivi** élève / formateur / école
- Une **API unique** pour tous les clients

</div>

<div>

### Acteurs & limites

<div class="text-sm flex flex-col gap-2">
  <div class="mm-card"><b style="color:#f87171">Admin / École</b> — gère écoles, classes, matières, utilisateurs</div>
  <div class="mm-card"><b style="color:#c084fc">Formateur</b> — crée les contenus, suit ses élèves</div>
  <div class="mm-card"><b style="color:#34d399">Élève</b> — visionne, progresse, est suivi</div>
</div>

<div class="mm-card mt-3 text-xs" style="border-color:#fbbf24">
<b style="color:#fbbf24">Limite assumée :</b> la couche IA (transcription, RAG, chat contextuel) est spécifiée mais hors périmètre de cette première version.
</div>

</div>

</div>

<!--
La plateforme Seira posait plusieurs problèmes : interface vieillissante, pas d'application mobile, et surtout aucune garantie que les élèves regardaient vraiment les vidéos. Un élève pouvait ouvrir une vidéo, aller faire autre chose, et cocher "vu" à la fin. C'est le problème central.

Le cahier des charges demandait une plateforme accessible via navigateur et via smartphone, avec une hiérarchie claire : une école gère des classes, des classes ont des matières, chaque matière contient des chapitres et des vidéos.

Il y a trois profils utilisateurs. L'administrateur, ou responsable école, configure tout : il crée les classes, assigne les formateurs, inscrit les élèves. Le formateur dépose les contenus vidéo et suit l'avancement de ses élèves. L'élève suit son parcours et visionne les vidéos.

La limite assumée — et c'est important de le dire au jury — c'est la couche IA. La transcription automatique des vidéos, le RAG, le chatbot contextuel : c'est spécifié dans notre dossier, mais pas encore implémenté. On livre d'abord la plateforme solide, et la couche IA vient en V3.
-->

---
layout: two-cols
layoutClass: gap-8
---

# Contraintes & livrables

### Contraintes

<div class="text-sm flex flex-col gap-2 mt-2">
  <div class="mm-card"><b>Sécurité</b> — auth, rôles, anti-fraude</div>
  <div class="mm-card"><b>Multi-plateforme</b> — web & mobile sur la même API</div>
  <div class="mm-card"><b>Évolutivité</b> — prête pour la couche IA</div>
  <div class="mm-card"><b>Reproductibilité</b> — environnement conteneurisé</div>
</div>

::right::

### Livrables

<div class="text-sm flex flex-col gap-2 mt-2">
  <div class="mm-card" style="border-color:#7bd0ff">API REST Laravel + doc OpenAPI</div>
  <div class="mm-card" style="border-color:#c084fc">Application web Angular (Vercel)</div>
  <div class="mm-card" style="border-color:#34d399">Application mobile Expo</div>
  <div class="mm-card" style="border-color:#818cf8">Schéma de BDD + suite de tests</div>
</div>

<div class="text-xs opacity-60 mt-3">
Documentation : <code>SCHEMA_BDD.md</code>, <code>BACKEND.md</code>, <code>TODO.md</code> de suivi.
</div>

<!--
Quatre grandes contraintes ont guidé nos choix techniques.

La sécurité d'abord : l'authentification par token Sanctum, les 30 gates de contrôle d'accès, et le système anti-triche qu'on va détailler dans les réalisations. Ce n'est pas une option, c'est le cœur du projet.

Multi-plateforme ensuite : la même API REST répond au navigateur Angular et à l'application Expo. Aucun endpoint n'est dupliqué. C'est l'avantage d'API Platform — l'API est la source de vérité unique.

Évolutivité : l'architecture est pensée pour accueillir la couche IA sans tout réécrire. Les modèles vidéo ont déjà les champs de métadonnées prévus pour les transcriptions.

Et la reproductibilité : tout tourne dans Docker. N'importe quel développeur clone le repo, lance `docker compose up`, et l'environnement complet est là en deux minutes.

En termes de livrables concrets : une API documentée avec Swagger sur `/api/docs`, le frontend Angular déployé sur Vercel, l'application mobile Expo, et un schéma de base de données complet avec 127 tests automatisés.
-->

---
layout: default
---

# Gestion de projet

<div class="grid grid-cols-2 gap-8 mt-2">

<div>

### Pilotage

- **GitHub Issues** + **Project board** « MontoMaster Roadmap »
- Découpage en **epics** puis issues fines (backend / web / mobile)
- Suivi d'avancement dans `TODO.md` (`[x]` / `[ ]` / ⚠️)
- Une **branche par lot**, intégration par **Pull Request**

</div>

<div>

### Méthode

<div class="text-sm flex flex-col gap-2">
  <div class="mm-card"><b style="color:#7bd0ff">Priorisation par dépendances</b><br>L'anti-triche backend débloque web & mobile → livré en premier.</div>
  <div class="mm-card"><b style="color:#34d399">TDD</b><br>Tests écrits avant/avec l'implémentation des règles métier sensibles.</div>
  <div class="mm-card"><b style="color:#c084fc">Parité web / mobile</b><br>Mêmes domaines, mêmes contrats — développés en miroir.</div>
</div>

</div>

</div>

<!--
Pour la gestion de projet, on a utilisé GitHub avec un project board. Chaque fonctionnalité est une issue, classée dans une epic — backend, frontend web, ou mobile.

Le fichier TODO.md est notre tableau de bord : chaque item est marqué [x] quand c'est livré, [ ] quand c'est à faire, et ⚠️ quand c'est partiel avec un commentaire expliquant pourquoi. Le jury peut le consulter dans le dossier.

Notre méthode de travail : une branche par lot fonctionnel, intégrée par Pull Request. Ça nous a permis de travailler proprement en isolant les risques — si une branche plante, elle n'affecte pas le reste.

La priorisation a été dictée par les dépendances techniques. On a commencé par l'anti-triche backend avant de toucher le frontend, parce que le frontend a besoin des endpoints pour fonctionner. C'est l'ordre logique.

Et le TDD : pour les règles métier sensibles — notamment le heartbeat anti-triche — on a écrit les tests d'abord. Ça nous a forcés à définir le comportement attendu avant l'implémentation, et ça nous a évité des bugs subtils sur la validation temporelle.
-->

---
src: ./pages/conception.md
---

---
src: ./pages/realisations.md
---

---
src: ./pages/tests.md
---

---
src: ./pages/deploiement.md
---

---
src: ./pages/cloture.md
---
