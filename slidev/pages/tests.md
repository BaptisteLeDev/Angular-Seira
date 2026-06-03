---
layout: section
---

# 4 · Plan de tests & jeu d'essai
<div class="text-base opacity-70 mt-2">Stratégie · PHPUnit · Vitest</div>

<!--
On passe aux tests. C'est une partie qu'on veut montrer concrètement, pas juste en décrire la stratégie dans l'abstrait.

Le chiffre clé : 127 tests automatisés, zéro échec. On va d'abord expliquer la stratégie — deux niveaux de tests, backend et frontend — et ensuite on va dérouler le jeu d'essai concret sur le système anti-triche, cas par cas.

C'est une compétence CDA directement évaluée : le plan de tests et le jeu d'essai.
-->

---
layout: default
---

# Stratégie de tests

<div class="grid grid-cols-2 gap-4 mt-2 text-sm">

<div class="mm-card">
<b style="color:#7bd0ff">Backend — PHPUnit + Laravel</b>
<ul class="text-xs mt-1">
<li>Tests Feature (HTTP) — comportement de l'API</li>
<li>Base SQLite en mémoire — état propre à chaque test</li>
<li>Factories Eloquent pour les données</li>
<li>Sanctum::actingAs() pour simuler les rôles</li>
<li>Carbon::setTestNow() pour le timing anti-triche</li>
</ul>
</div>

<div class="mm-card">
<b style="color:#c084fc">Frontend — Vitest + Angular</b>
<ul class="text-xs mt-1">
<li>Tests unitaires composants</li>
<li>Tests routing et guards</li>
<li>provideRouter() pour isoler les composants</li>
</ul>
</div>

</div>

<div class="mm-card mt-3 text-xs" style="border-color:#fbbf24">
<b>TDD sur les règles métier sensibles :</b> tests du heartbeat écrits avant l'implémentation — ça a forcé à définir le comportement attendu sur chaque cas limite avant d'écrire le code.
</div>

<!--
On a deux niveaux de tests.

Côté backend, 127 tests Feature avec PHPUnit. Ce sont des tests d'intégration qui envoient de vraies requêtes HTTP à l'API et vérifient les réponses. La base est SQLite en mémoire — chaque test repart d'un état propre sans affecter les autres.

Pour simuler les rôles, on utilise Sanctum::actingAs() qui impersonne un utilisateur authentifié. Ça permet de tester que l'admin peut tout faire, que le formateur ne voit que ses matières, que l'élève ne peut pas modifier la progression d'un autre.

Pour tester le système anti-triche, on utilise Carbon::setTestNow() pour simuler le passage du temps — on avance l'horloge de 26 secondes pour simuler un segment de 30 secondes valide, ou de 5 secondes pour tester la soumission trop précoce.

La philosophie TDD sur l'anti-triche : on a d'abord écrit le test "heartbeat soumis trop tôt retourne 422", puis on a implémenté la validation temporelle. Ça oblige à définir exactement ce qu'on attend avant d'écrire le code.
-->

---
layout: default
---

# Jeu d'essai — Anti-triche

<div class="text-xs flex flex-col gap-2 mt-2">
  <div class="mm-card" style="border-color:#34d399">✓ Token valide, timing correct → heartbeat crédite les secondes</div>
  <div class="mm-card" style="border-color:#34d399">✓ Heartbeat trop tôt → 422 « Heartbeat soumis trop tôt »</div>
  <div class="mm-card" style="border-color:#34d399">✓ Heartbeat trop tard → 422 « Token expiré »</div>
  <div class="mm-card" style="border-color:#34d399">✓ Signature falsifiée → 422 « Signature de token invalide »</div>
  <div class="mm-card" style="border-color:#34d399">✓ Token d'un autre utilisateur → 422</div>
  <div class="mm-card" style="border-color:#34d399">✓ Replay du même token → 422 « Replay détecté »</div>
  <div class="mm-card" style="border-color:#34d399">✓ Watched_seconds plafonnés à la durée vidéo</div>
</div>

<!--
On déroule le jeu d'essai sur l'anti-triche, qui est le scénario le plus critique.

Premier cas : un élève regarde correctement les 30 secondes et envoie le heartbeat dans la fenêtre valide. Le serveur crédite les secondes. Test vert.

Deuxième cas : l'élève envoie le heartbeat trop tôt — avant que les 30 secondes se soient écoulées. Le serveur répond 422 avec un message indiquant combien de secondes il reste à attendre. Test vert.

Troisième cas : l'élève a attendu trop longtemps — plus de 90 secondes après l'émission du token. Token expiré. Test vert.

Quatrième cas : l'élève modifie le token avant de l'envoyer. La vérification HMAC échoue. Test vert.

Cinquième cas : l'élève utilise le token d'un autre utilisateur. Le uid dans le token ne correspond pas à l'utilisateur authentifié. Test vert.

Sixième cas : l'élève envoie le même token deux fois. Le nonce a été consommé lors du premier heartbeat. Replay détecté. Test vert.

Septième cas : les secondes ne peuvent jamais dépasser la durée totale de la vidéo. Test vert.

Sept scénarios, sept tests, sept verts.
-->
