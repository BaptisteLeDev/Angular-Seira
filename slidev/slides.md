---
theme: seriph
title: MontoMaster — Dossier de projet CDA
info: |
  ## MontoMaster V2
  Présentation de projet — Titre professionnel Concepteur Développeur d'Applications.
  Plateforme e-learning, remplaçant de Seira.
author: Candidat CDA
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
  Candidat · Baptiste — Session CDA
</div>

<!--
Projet réalisé en formation. Le plan suit le dossier de projet CDA : besoins → gestion de projet → conception → réalisations → tests → déploiement → veille → conclusion. Périmètre IA volontairement hors session.
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
Cette diapo est la grille de lecture pour le jury : elle annonce où chaque compétence sera démontrée.
-->

---
layout: section
transition: slide-left
---

# 1 · Besoins & gestion de projet
<div class="text-base opacity-70 mt-2">Analyser les besoins · Contribuer à la gestion d'un projet</div>

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
Documentation : <code>SCHEMA_BDD.md</code>, <code>CLAUDE.md</code>, <code>TODO.md</code> de suivi.
</div>

---
layout: default
---

# Gestion de projet

<div class="grid grid-cols-2 gap-8 mt-2">

<div>

### Pilotage

- **GitHub Issues** + **Project board** « MontoMaster Roadmap »
- Découpage en **epics** puis issues fines (backend / web / mobile)
- Suivi d'avancement vérifié dans `TODO.md` (`[x]` / `[ ]` / ⚠️)
- Une **branche par lot**, intégration par **Pull Request**

</div>

<div>

### Méthode

<div class="text-sm flex flex-col gap-2">
  <div class="mm-card"><b style="color:#7bd0ff">Priorisation par dépendances</b><br>L'anti-triche backend débloque web & mobile → livrée en premier.</div>
  <div class="mm-card"><b style="color:#34d399">TDD</b><br>Tests écrits avant/avec l'implémentation des règles métier sensibles.</div>
  <div class="mm-card"><b style="color:#c084fc">Parité web / mobile</b><br>Mêmes domaines, mêmes contrats — développés en miroir.</div>
</div>

</div>

</div>

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
