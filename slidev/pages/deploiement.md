---
layout: section
transition: slide-left
---

# 5 · Déploiement & DevOps
<div class="text-base opacity-70 mt-2">Préparer, documenter et mettre en production</div>

<!--
Cinquième partie : comment on prépare, documente et met en production l'application.
-->

---
layout: default
---

# Préparer & documenter le déploiement

<div class="grid grid-cols-2 gap-8 mt-2">

<div>

### Backend — conteneurs

- Stack décrite dans `docker-compose.yml` (nginx · php · mariadb · redis)
- Migrations & seeders versionnés (`artisan migrate` / `db:seed`)
- Configuration par `.env` (clés, BDD, Redis)

### Frontend — Vercel

- `vercel.json` : install **pnpm**, build, **rewrite SPA** → `index.html`
- Sortie : `dist/Angular-Seira/browser`
- Variables `NG_APP_*` définies dans Vercel

</div>

<div>

### Documentation livrée

<div class="text-sm flex flex-col gap-2">
  <div class="mm-card"><code>CLAUDE.md</code> — architecture & commandes</div>
  <div class="mm-card"><code>SCHEMA_BDD.md</code> — source de vérité du modèle</div>
  <div class="mm-card"><code>TODO.md</code> — suivi d'avancement vérifié</div>
  <div class="mm-card"><code>/api/docs</code> — contrat OpenAPI auto</div>
</div>

<div class="mm-card mt-3 text-xs" style="border-color:#34d399">
Comptes de seed documentés pour démo : <code>admin</code> / <code>prof</code> / <code>eleve</code> @monto.test.
</div>

</div>

</div>

<!--
Pour la préparation, deux cibles distinctes. Le backend est conteneurisé : tout est décrit dans le docker-compose, les migrations et seeders sont versionnés, et la configuration passe par les variables d'environnement. Le frontend, lui, est déployé sur Vercel : le vercel.json gère l'installation pnpm, le build, et surtout le rewrite SPA vers index.html — indispensable pour qu'une URL profonde fonctionne au rechargement. Les variables NG_APP sont définies dans Vercel. Côté documentation livrée : CLAUDE.md pour l'architecture et les commandes, SCHEMA_BDD comme source de vérité du modèle, un TODO de suivi, et le contrat OpenAPI auto-généré. On a aussi documenté trois comptes de seed — admin, prof, élève — pour rendre la démo immédiate.
-->

---
layout: default
---

# Démarche DevOps

<div class="grid grid-cols-2 gap-8 mt-2">

<div>

### Mise en production

<div class="text-sm flex flex-col gap-2">
  <div class="mm-card"><b style="color:#7bd0ff">Déploiement continu</b><br>Push sur GitHub → build & déploiement automatique sur Vercel (preview par branche, prod sur la principale).</div>
  <div class="mm-card"><b style="color:#c084fc">Parité des environnements</b><br>Docker reproduit la stack en local comme en intégration.</div>
  <div class="mm-card"><b style="color:#34d399">Intégration par PR</b><br>Une branche par lot, revue puis fusion.</div>
</div>

</div>

<div>

```mermaid {scale: 0.56}
flowchart LR
  DEV["Développement<br/>(branche)"] --> PR["Pull Request"]
  PR --> REV["Revue + tests"]
  REV --> MAIN["main"]
  MAIN --> VC["Vercel (web)"]
  MAIN --> BUILD["Image backend<br/>(Docker)"]
  VC --> PROD["Préview / Prod"]
  BUILD --> PROD
```

<div class="text-xs opacity-60 mt-2">
Piste d'amélioration : ajouter une <b>CI</b> (GitHub Actions) exécutant la suite de tests à chaque PR.
</div>

</div>

</div>

<!--
Notre démarche DevOps suit un flux simple et continu : un push sur une branche déclenche un build et un déploiement automatique sur Vercel — un environnement de preview par branche, la production sur la branche principale. Docker nous garantit la parité des environnements, du local à l'intégration. Et l'intégration se fait par Pull Request : une branche par lot, revue, puis fusion. On termine sur une piste d'amélioration qu'on assume comme telle : aujourd'hui les tests se lancent manuellement ; la prochaine étape est une CI GitHub Actions qui exécuterait la suite à chaque PR pour bloquer toute régression avant la fusion. C'est volontairement présenté comme un axe de progression, pas comme un acquis.
-->

