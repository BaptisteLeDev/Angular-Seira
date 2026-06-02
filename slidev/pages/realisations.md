---
layout: section
transition: slide-left
---

# 3 · Réalisations
<div class="text-base opacity-70 mt-2">Environnement · Interfaces · Métier · Accès données · Sécurité</div>

---
layout: default
---

# Environnement de travail

<div class="grid grid-cols-2 gap-8 mt-2">

<div>

### Stack conteneurisée (Docker Compose)

<div class="text-sm flex flex-col gap-2">
  <div class="mm-card"><code>nginx:1.27</code> → <code>php-fpm</code> (Laravel 12 · PHP 8.2)</div>
  <div class="mm-card"><code>mariadb:11</code> · <code>redis:7</code> · <code>phpmyadmin</code></div>
  <div class="mm-card">Un <code>docker compose up</code> = environnement complet, reproductible</div>
</div>

### Outillage

- **Backend** : Composer, Artisan, PHPUnit
- **Web** : pnpm, Angular CLI, Vitest, `@ngx-env`
- **Mobile** : pnpm, Expo CLI
- **Versionnage** : Git + GitHub (branches, PR)

</div>

<div>

```mermaid {scale: 0.58}
flowchart TB
  subgraph Docker["docker compose"]
    NG["nginx :8080"] --> PHP["php-fpm<br/>Laravel 12"]
    PHP --> MDB[("mariadb :3307")]
    PHP --> RDS[("redis")]
    PMA["phpmyadmin :8081"] --> MDB
  end
  WEB["ng serve :4200"] -->|NG_APP_BACKEND_URL| NG
  MOB["expo start"] --> NG
```

<div class="text-xs opacity-60 mt-2">
Variables d'env : <code>NG_APP_*</code> (web), <code>src/constants/env.ts</code> (mobile).
</div>

</div>

</div>

---

# Interfaces utilisateur — parcours élève

<div class="grid grid-cols-2 gap-4 mt-2">

<div>

![Catalogue des matières](../screens/ui-formations.png){class="rounded-lg shadow-xl border border-gray-700 max-h-[62vh]"}

<div class="text-xs opacity-60 text-center mt-1">Catalogue — cartes par matière, code couleur catégorie</div>

</div>

<div>

![Ma progression](../screens/ui-progression.png){class="rounded-lg shadow-xl border border-gray-700 max-h-[62vh]"}

<div class="text-xs opacity-60 text-center mt-1">Ma progression — KPIs certifiés + avancement par matière</div>

</div>

</div>

---

# Interfaces — cours & lecteur contrôlé

<div class="grid grid-cols-2 gap-4 mt-2">

<div>

![Page de cours](../screens/ui-cours.png){class="rounded-lg shadow-xl border border-gray-700 max-h-[62vh]"}

<div class="text-xs opacity-60 text-center mt-1">Cours — sommaire (vidéo · PDF · article) + progression</div>

</div>

<div>

![Lecteur vidéo](../screens/ui-lecteur.png){class="rounded-lg shadow-xl border border-gray-700 max-h-[62vh]"}

<div class="text-xs opacity-60 text-center mt-1">Lecteur contrôlé — support YouTube IFrame + suivi</div>

</div>

</div>

<div class="text-xs opacity-60 text-center mt-2">
L'application <b>mobile (Expo)</b> reprend ces mêmes écrans en parité, avec le lecteur <code>expo-video</code>.
</div>

---

# Interfaces — composants partagés web / mobile

<div class="grid grid-cols-2 gap-6 mt-2 text-sm">

<div>

Web et mobile partagent **la même structure logique** (schémas Zod, API, stores, guards) et une **bibliothèque de composants** miroir.

<div class="flex flex-col gap-2 mt-2">
  <div class="mm-card"><b style="color:#c084fc">🌐 shared/ui/</b> — <code>video-player</code>, <code>markdown-view</code>, <code>pdf-viewer</code>, <code>empty-state</code>…</div>
  <div class="mm-card"><b style="color:#34d399">📱 src/ui/</b> — <code>VideoPlayer</code>, <code>MarkdownView</code>, <code>PdfViewer</code>, <code>EmptyState</code>…</div>
</div>

</div>

<div>

Même validation Zod des deux côtés :

```ts
// web : opérateur RxJS
parseHydraCollection(FormationSchema)
// → map(r => schema.parse(r).member)

// mobile : fonction pure
parseHydraCollection(FormationSchema, raw)
// → schema.parse(raw).member
```

<div class="text-xs opacity-60 mt-2">
Différenciation : <b>signals</b> (web) vs <b>zustand</b> (mobile), <b>RxJS</b> vs <b>async/await</b>.
</div>

</div>

</div>

---
layout: section
transition: slide-up
---

# Composants métier
<div class="text-base opacity-70 mt-2">State Processors · Services — la logique applicative</div>

---

# Le pattern de mutation — DTO → Processor

<div class="grid grid-cols-2 gap-6 mt-2">

<div>

```php {all|1-5|7-10|12-14}
class AuthLoginProcessor
  implements ProcessorInterface
{
  public function process(
    mixed $data, Operation $op, ...
  ): JsonResponse {
    // $data = DTO validé
    $user = User::where('email', $data->email)
      ->first();
    if (!$user || !Hash::check(
        $data->password, $user->password)) {
      throw new AuthenticationException();
    }
    $token = $user->createToken('api-token')
      ->plainTextToken;
    return new JsonResponse([...]);
  }
}
```

</div>

<div class="text-sm flex flex-col gap-3 mt-4">

<div class="mm-card">
<b style="color:#7bd0ff">1 · DTO d'entrée</b><br>
Forme & validation du payload, découplé du modèle.
</div>
<div class="mm-card">
<b style="color:#c084fc">2 · State Processor</b><br>
Reçoit le DTO, applique la règle métier, persiste.
</div>
<div class="mm-card">
<b style="color:#34d399">3 · State Provider</b><br>
Personnalise la lecture (filtrage par propriétaire).
</div>

<div class="text-xs opacity-60">
Aucun contrôleur REST classique : l'API est déclarée sur les modèles.
</div>

</div>

</div>

---

# Composant métier phare — l'anti-triche

<div class="grid grid-cols-2 gap-6 mt-2">

<div>

```php {all|1-4|6-7|9-11}
// WatchTokenService — clé signée par segment
$payload = ['uid'=>$u, 'vid'=>$v,
  'seg_start'=>$s, 'seg_end'=>$e,
  'iat'=>now(), 'nonce'=>random()];

$token = base64($payload) . '.' .
  hash_hmac('sha256', $payload, $secret);

// nonce en Redis, TTL court, à usage unique
Cache::put("watch_nonce:$nonce",
  'pending', $ttl);
```

</div>

<div class="text-sm flex flex-col gap-2">

<div class="mm-card" style="border-color:#f87171">
<b style="color:#f87171">Problème résolu</b><br>
Sans contrôle serveur, un <code>curl</code> certifie 1 h de visionnage.
</div>

<div class="mm-card"><b style="color:#7bd0ff">Signature HMAC-SHA256</b> — toute altération invalide le token.</div>
<div class="mm-card"><b style="color:#7bd0ff">Anti-rejeu</b> — nonce <code>pending → used</code>, usage unique.</div>
<div class="mm-card"><b style="color:#7bd0ff">Fenêtre temporelle</b> — ni trop tôt, ni trop tard.</div>

</div>

</div>

---
layout: section
transition: slide-up
---

# Composants d'accès aux données
<div class="text-base opacity-70 mt-2">SQL (Eloquent / MariaDB) & NoSQL (Redis)</div>

---

# Accès SQL — Eloquent + API Platform

<div class="grid grid-cols-2 gap-6 mt-2">

<div>

La ressource est déclarée sur le **modèle Eloquent**, le **Provider** restreint la lecture au propriétaire.

```php {all|1-2|4-8}
// State Provider — isolation par user_id
public function provide($op, ...): iterable
{
  $user = $request->user();
  if ($user->isAdmin())
    return VideoProgress::all();

  return VideoProgress::where(
    'user_id', $user->id)->get();
}
```

</div>

<div>

```php {all|1-5|6-9}
#[ApiResource(operations: [
  new GetCollection(
    uriTemplate: '/video-progress',
    provider: ...CollectionProvider::class,
  ),
  new Patch(
    input: ...UpdateInput::class,
    processor: ...UpdateProcessor::class,
  ),
])]
class VideoProgress extends Model { /* … */ }
```

<div class="text-xs opacity-60 mt-2">
Relations Eloquent (<code>belongsTo</code> / <code>hasMany</code>), migrations versionnées, <b>SoftDeletes</b>.
</div>

</div>

</div>

---

# Accès NoSQL — Redis

<div class="grid grid-cols-2 gap-6 mt-2">

<div>

Redis (clé-valeur) porte l'**état éphémère** de l'anti-triche : les **nonces** des clés temporelles, hors base relationnelle.

```php {all|1-2|4-6|8-9}
// émission : nonce "en attente", TTL court
Cache::put("watch_nonce:$nonce", 'pending', $ttl);

// validation : lecture de l'état
$status = Cache::get("watch_nonce:$nonce");
// null = expiré · 'used' = rejeu

// consommation : usage unique
Cache::put("watch_nonce:$nonce", 'used', 300);
```

</div>

<div class="text-sm flex flex-col gap-2">

<div class="mm-card"><b style="color:#34d399">Le bon outil</b><br>Des entrées à durée de vie courte, à très forte rotation → clé-valeur en mémoire, pas du SQL.</div>
<div class="mm-card"><b style="color:#7bd0ff">TTL natif</b><br>L'expiration des clés est gérée par Redis lui-même.</div>
<div class="mm-card"><b style="color:#c084fc">Aussi</b><br>Cache applicatif & sessions (config / route cache).</div>

</div>

</div>

---

# Autres composants — contrôleur & API exposée

<div class="grid grid-cols-2 gap-5 mt-2">

<div>

Quelques endpoints sortent du CRUD et utilisent un **contrôleur dédié** (`WatchSessionController`, `AggregateController`, `UserSchoolController`) :

```php
Route::middleware('auth:sanctum')
  ->prefix('watch-sessions')->group(function () {
    Route::post('/request',   [WatchSessionController::class, 'request']);
    Route::post('/heartbeat', [WatchSessionController::class, 'heartbeat']);
});
```

<div class="text-xs opacity-60 mt-1">
Utilitaires côté client : intercepteurs (Bearer / 401), <code>parseResponse</code>, <code>utils/iri</code>.
</div>

</div>

<div>

![OpenAPI — /api/docs](../screens/swagger-overview.png){class="rounded-lg shadow-xl border border-gray-700 max-h-[58vh]"}

<div class="text-xs opacity-60 text-center mt-1">Documentation OpenAPI générée automatiquement</div>

</div>

</div>

---
layout: section
transition: slide-up
---

# Sécurité de l'application
<div class="text-base opacity-70 mt-2">Authentification · Autorisation · Anti-fraude</div>

---

# Authentification & autorisation

<div class="grid grid-cols-2 gap-6 mt-2">

<div>

### Sanctum — tokens Bearer

- `/auth/login` émet un token, persisté côté client
- Toutes les routes protégées par `middleware: auth:sanctum`

### RBAC — Gates centralisées

```php
Gate::define('subjects.view',
  function (User $u, $subject) {
    if ($u->isAdmin()) return true;
    if ($u->role === ROLE_TEACHER)
      return $subject->teacher_id === $u->id;
    if ($u->role === ROLE_STUDENT)
      return $subject->classrooms()
        ->where('id', $u->classroom_id)->exists();
    return false;
  });
```

</div>

<div class="text-sm flex flex-col gap-2">

<div class="mm-card"><b style="color:#f87171">admin</b> — accès total</div>
<div class="mm-card"><b style="color:#c084fc">teacher</b> — ses matières + contenus liés</div>
<div class="mm-card"><b style="color:#34d399">student</b> — contenus de sa classe ; progression filtrée sur <code>user_id</code></div>

<div class="mm-card text-xs" style="border-color:#7bd0ff">
30+ Gates · isolation des données par école / classe · référencées par le champ <code>policy</code> de chaque opération.
</div>

</div>

</div>

---

# Sécurité — l'anti-fraude en défense en profondeur

<div class="grid grid-cols-2 gap-6 mt-4 text-sm">

<div class="mm-card">
<b style="color:#7bd0ff">Côté client</b><br>
Lecture active requise · vitesse bridée (≤ 2x web / 1x mobile) · anti-seek · pause si onglet masqué.
</div>

<div class="mm-card">
<b style="color:#7bd0ff">Signature serveur</b><br>
Clé HMAC-SHA256 par segment ; le client ne peut pas la forger.
</div>

<div class="mm-card">
<b style="color:#7bd0ff">Anti-rejeu</b><br>
Nonce à usage unique en Redis : rejouer une clé → <code>422</code>.
</div>

<div class="mm-card">
<b style="color:#7bd0ff">Fenêtre temporelle</b><br>
Soumission contrainte dans le temps ; impossible de batcher les clés.
</div>

</div>

<div class="mm-card mt-4 text-xs" style="border-color:#f87171">
<b style="color:#f87171">Principe :</b> le temps « validé » n'est <b>jamais</b> accepté tel quel — il n'est crédité que par consommation d'une clé serveur valide, et borné à la durée réelle de la vidéo.
</div>
