---
layout: section
---

# 6 · Veille & Conclusion
<div class="text-base opacity-70 mt-2">Sécurité · Bilan · Perspectives</div>

<!--
On arrive à la dernière partie : veille sécurité, bilan du projet, et perspectives.

On va d'abord faire le point sur la sécurité — ce qu'on a mis en place, et surtout ce qu'on a identifié comme points à améliorer. L'honnêteté sur les limites est une qualité professionnelle.

Ensuite le bilan : ce qui est livré concrètement, ce qu'on a appris. Et on fermera sur les perspectives de la V3 avec la couche IA.
-->

---
layout: default
---

# Veille sécurité

<div class="grid grid-cols-2 gap-4 mt-2 text-sm">

<div class="mm-card">
<b style="color:#34d399">Mesures en place</b>
<ul class="text-xs mt-1">
<li>Token Sanctum révocable</li>
<li>RBAC avec isolation par école</li>
<li>Anti-triche HMAC-SHA256 + nonce Redis</li>
<li>SoftDeletes — pas de suppression définitive</li>
<li>Aucun secret dans le code (.env)</li>
</ul>
</div>

<div class="mm-card">
<b style="color:#fbbf24">Points identifiés à traiter</b>
<ul class="text-xs mt-1">
<li>Logs d'activité (audit trail) — à implémenter</li>
<li>Anonymisation RGPD à compléter</li>
<li>Rate limiting sur les endpoints publics</li>
<li>Bypass possible en fullscreen natif mobile</li>
</ul>
</div>

</div>

<!--
Sur la sécurité, plusieurs mesures sont en place.

L'authentification par token Sanctum est révocable : si un token est compromis, l'admin peut le révoquer immédiatement. Contrairement à un JWT standard qui est valide jusqu'à expiration.

Le RBAC est strict, avec une isolation par school_id dans chaque gate. Un utilisateur d'une école ne peut pas voir les données d'une autre.

Le système anti-triche HMAC-SHA256 avec nonce Redis.

Et une règle fondamentale : aucun secret dans le code. Toutes les variables sensibles passent par le fichier .env.

On veut être honnêtes sur ce qui reste à faire. Les logs d'activité ne sont pas encore implémentés — on n'a pas de trace de qui a fait quoi et quand. L'anonymisation RGPD est partielle. Et sur mobile, le fullscreen natif peut contourner certaines contraintes du lecteur — c'est identifié, documenté, et prévu pour la prochaine itération.

Cette transparence est importante : un développeur professionnel sait ce que son code ne fait pas encore.
-->

---
layout: default
---

# Bilan & Perspectives

<div class="grid grid-cols-2 gap-4 mt-2 text-sm">

<div class="mm-card">
<b style="color:#34d399">Ce qui est livré</b>
<ul class="text-xs mt-1">
<li>API REST complète — 8 modèles, 30+ gates</li>
<li>Suivi certifié anti-triche opérationnel</li>
<li>Frontend Angular fonctionnel</li>
<li>Application mobile Expo fonctionnelle</li>
<li>127 tests automatisés — 0 échec</li>
</ul>
</div>

<div class="mm-card">
<b style="color:#818cf8">V3 — Couche IA</b>
<ul class="text-xs mt-1">
<li>Transcription automatique (Whisper)</li>
<li>RAG sur transcriptions + PDF référentiel</li>
<li>Chat contextuel IA dans le lecteur vidéo</li>
<li>Logs d'activité + conformité RGPD complète</li>
</ul>
</div>

</div>

<!--
Pour le bilan.

Ce qui est livré : une API REST robuste avec 8 modèles et plus de 30 gates. Un système anti-triche qui fonctionne. Un frontend Angular et une application mobile Expo. Et 127 tests sans aucun échec.

Ce projet nous a appris plusieurs choses. La conception avant le code — les décisions prises sur le schéma de BDD au début ont évité des refactorisations coûteuses plus tard. La valeur des tests — les 127 tests nous ont permis de refactoriser du code sans régression, c'est un filet de sécurité réel. Et la rigueur de l'architecture en couches — quand backend, web et mobile sont bien séparés, on peut faire évoluer chaque couche indépendamment.

Les perspectives sont claires. La couche IA est spécifiée et documentée dans le dossier. Whisper pour la transcription automatique des vidéos, un système RAG qui indexe les transcriptions et les référentiels PDF, et un chatbot contextuel dans le lecteur vidéo. C'est la V3.

Merci pour votre attention. On est disponibles pour vos questions.
-->

---
layout: center
class: text-center
---

# Merci

<div class="text-xl opacity-70 mt-4">MontoMaster V2 — Dossier de projet CDA</div>

<div class="mt-8 flex justify-center gap-6 text-sm">
  <span class="mm-chip" style="color:#7bd0ff">Laravel 12 · API Platform</span>
  <span class="mm-chip" style="color:#c084fc">Angular 21</span>
  <span class="mm-chip" style="color:#34d399">Expo / React Native</span>
</div>

<div class="mt-6 text-xs opacity-50">
  127 tests · 0 échec · Déployé sur Vercel
</div>

<!--
Slide de clôture — laissez-la à l'écran pendant les questions.

Si le jury pose des questions sur l'anti-triche, les tests, ou l'architecture, naviguez directement vers les slides correspondantes dans Slidev avec les flèches.
-->
