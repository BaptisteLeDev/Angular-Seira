---
layout: section
transition: slide-left
---

# 4 · Plan de tests
<div class="text-base opacity-70 mt-2">Préparer et exécuter les plans de tests d'une application</div>

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
