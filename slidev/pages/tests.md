---
layout: section
transition: slide-left
---

# 4 · Plan de tests
<div class="text-base opacity-70 mt-2">Préparer et exécuter les plans de tests d'une application</div>

<!--
[~15 s — transition] Quatrième partie : le plan de tests. Je vais présenter ma stratégie, puis la décliner sur l'anti-triche par les cas d'attaque, et finir sur un jeu d'essai formalisé.
-->

---
layout: default
---

# Stratégie de tests

<div class="grid grid-cols-2 gap-8 mt-2">

<div>

### Backend — 127 tests (PHPUnit)

- `php artisan test` sur **SQLite `:memory:`**
- `RefreshDatabase` + **factories** par entité
- `Sanctum::actingAs($user)` pour chaque rôle
- `Carbon::setTestNow()` pour piloter le **temps**
- Chaque endpoint testé : **401 / 403 / 422 / 200**

</div>

<div>

### Couverture & front

<div class="text-sm flex flex-col gap-2">
  <div class="mm-card">API CRUD · auth · rôles (isolation école/classe)</div>
  <div class="mm-card"><b style="color:#7bd0ff">Anti-triche</b> — chaque garde-fou a son test d'attaque</div>
  <div class="mm-card">Agrégats prof / école</div>
  <div class="mm-card"><b style="color:#c084fc">Web</b> — tests <b>Vitest</b> (stores, parsing Zod, lecteur)</div>
</div>

<div class="mm-card mt-2 text-xs" style="border-color:#34d399">
Tests écrits <b>avant/avec</b> l'implémentation des règles sensibles (TDD).
</div>

</div>

</div>

<!--
[~55 s] Côté backend, j'ai 127 tests PHPUnit qui tournent sur une base SQLite en mémoire, avec RefreshDatabase et des factories par entité — c'est rapide et isolé. Pour les rôles, j'utilise Sanctum::actingAs afin de jouer chaque profil, et surtout Carbon::setTestNow pour piloter le temps : indispensable pour tester la fenêtre temporelle et l'expiration des clés sans attendre réellement. Ma règle : chaque endpoint est testé sur ses quatre réponses — 401 non authentifié, 403 interdit, 422 invalide, 200 succès. La couverture porte sur le CRUD, l'auth, l'isolation école/classe, l'anti-triche, et les agrégats. Côté web, des tests Vitest sur les stores, le parsing Zod et le lecteur. Le tout en TDD sur les règles sensibles : les tests d'abord.
-->

---

# Tester par les cas d'attaque

<div class="grid grid-cols-2 gap-6 mt-2">

<div class="text-xs flex flex-col gap-2">

### Cas de rejet couverts

  <div class="mm-card font-mono">…rejects_tampered_signature</div>
  <div class="mm-card font-mono">…rejects_replay_of_same_token</div>
  <div class="mm-card font-mono">…rejects_submission_too_early</div>
  <div class="mm-card font-mono">…rejects_expired_token_past_late_buffer</div>
  <div class="mm-card font-mono">…student_without_classroom_access_gets_403</div>

</div>

<div>

```php {all|3-5|7-9|11-13}
public function test_heartbeat_rejects_replay_of_same_token()
{
  Sanctum::actingAs($admin);
  $tok = $this->requestToken($video->id, 0);

  // 1er heartbeat : accepté
  $this->postJson('/api/watch-sessions/heartbeat',
    ['token' => $tok['token']])->assertOk();

  // rejeu du même token : refusé
  $this->postJson('/api/watch-sessions/heartbeat',
    ['token' => $tok['token']])
    ->assertStatus(422);
}
```

</div>

</div>

<!--
[~50 s] Plutôt que de tester seulement le chemin nominal, j'ai testé l'anti-triche par ses cas d'attaque — c'est la bonne manière d'éprouver une sécurité. À gauche, la liste des rejets couverts : signature falsifiée, rejeu du même token, soumission trop tôt, token expiré au-delà du buffer, et accès d'un élève sans classe. À droite, un test concret : je demande un token, le premier heartbeat est accepté, et je vérifie que rejouer exactement le même token renvoie un 422. Chaque garde-fou décrit dans la partie réalisations a donc son test négatif correspondant. Si demain je casse l'anti-rejeu en refactorant, ce test échoue immédiatement.
-->

---
layout: default
---

# Jeu d'essai — fonctionnalité la plus représentative

Validation du temps de visionnage par segments successifs (`test_heartbeat_accumulates_across_multiple_segments`) :

<div class="text-sm mt-3">

| # | Données en entrée | Données attendues | Données obtenues | Écart |
|---|-------------------|-------------------|------------------|-------|
| 1 | `request(video, seg=0)` à `t0` | token segment `[0,30]` | token + `seg_end=30` | ✅ aucun |
| 2 | `heartbeat(token)` à `t0+26s` | `validated_seconds = 30` | `30` | ✅ aucun |
| 3 | `request(video, seg=30)` à `t0+30s` | token segment `[30,60]` | token + `seg_end=60` | ✅ aucun |
| 4 | `heartbeat(token)` à `t0+57s` | `validated_seconds = 60` | `60` | ✅ aucun |
| 5 | rejeu du token de l'étape 2 | rejet `422` | `422` | ✅ aucun |

</div>

<div class="mm-card mt-4 text-xs" style="border-color:#34d399">
<b style="color:#34d399">Analyse :</b> aucun écart. Le temps validé s'accumule uniquement par clés valides soumises dans leur fenêtre temporelle, et le rejeu est bloqué — la fonctionnalité se comporte conformément à la spécification anti-triche.
</div>

<!--
[~55 s] Voici mon jeu d'essai formalisé, sur la fonctionnalité la plus représentative : l'accumulation du temps validé sur plusieurs segments. Le tableau suit la structure attendue par le dossier — données en entrée, résultat attendu, résultat obtenu, écart. Je demande un premier segment, je valide 30 secondes ; un deuxième segment, le total passe à 60 ; et à l'étape 5, je rejoue volontairement un ancien token, qui est rejeté en 422. Colonne « écart » : aucun, sur toutes les lignes. L'analyse, en bas : le temps ne s'accumule que par des clés valides soumises dans leur fenêtre, et le rejeu est bloqué — le comportement est conforme à la spécification anti-triche. C'est la preuve, chiffrée, que le cœur du projet fait ce qu'il promet. Je passe au déploiement.
-->

