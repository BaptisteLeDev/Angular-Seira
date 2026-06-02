---
layout: section
transition: slide-left
---

# 6 · Veille & conclusion

<!--
[~15 s — transition] Dernière partie : ma veille sécurité, puis la synthèse, les difficultés rencontrées et la suite envisagée.
-->

---
layout: default
---

# Veille sécurité

<div class="grid grid-cols-2 gap-8 mt-2">

<div>

### Axes de veille (OWASP)

<div class="text-sm flex flex-col gap-2">
  <div class="mm-card"><b>Broken Access Control</b> → Gates par opération + isolation école/classe</div>
  <div class="mm-card"><b>Business Logic Abuse</b> → la faille centrale du projet : temps de visionnage falsifiable</div>
  <div class="mm-card"><b>Mass Assignment</b> → DTO d'entrée dédiés, champs sensibles non exposés</div>
  <div class="mm-card"><b>Auth / token</b> → Sanctum, stockage sécurisé (SecureStore mobile)</div>
</div>

</div>

<div>

### Vulnérabilités traitées

<div class="text-sm flex flex-col gap-2">
  <div class="mm-card" style="border-color:#f87171">
  <b style="color:#f87171">Falsification du temps</b><br>
  Un client pouvait certifier un temps arbitraire → corrigé par clés HMAC + anti-rejeu + fenêtre temporelle.
  </div>
  <div class="mm-card" style="border-color:#fbbf24">
  <b style="color:#fbbf24">Audit du code</b><br>
  Une revue de sécurité a fait remonter des points sensibles, tracés en <b>issues GitHub</b> et priorisés.
  </div>
</div>

<div class="text-xs opacity-60 mt-2">
Reste à durcir : logs d'activité (audit) et conformité RGPD (anonymisation / export).
</div>

</div>

</div>

<!--
[~55 s] Ma veille s'organise autour de l'OWASP, en reliant chaque axe à une réalisation concrète. Le Broken Access Control, traité par mes Gates et l'isolation école/classe. Le Business Logic Abuse — c'est la faille centrale de ce projet : un temps de visionnage falsifiable — traité par tout le dispositif anti-triche. Le Mass Assignment, neutralisé par mes DTO d'entrée qui n'exposent jamais les champs sensibles. Et la gestion des tokens via Sanctum et le stockage sécurisé. À droite, je distingue ce qui est traité de ce qui reste à durcir : la falsification du temps est corrigée et prouvée ; et un audit que j'ai conduit a fait remonter des points que j'ai tracés en issues GitHub et priorisés — typiquement les logs d'activité et la conformité RGPD. Cette honnêteté sur le reste-à-faire fait partie de la démarche de veille : on ne sécurise jamais « une fois pour toutes ».
-->

---
layout: default
---

# Synthèse & conclusion

<div class="grid grid-cols-2 gap-8 mt-2">

<div>

### Satisfactions

<div class="text-sm flex flex-col gap-2">
  <div class="mm-card" style="border-color:#34d399">Une <b>API unique</b> propre, consommée par web & mobile en miroir</div>
  <div class="mm-card" style="border-color:#34d399">Une <b>anti-triche</b> robuste, prouvée par les tests</div>
  <div class="mm-card" style="border-color:#34d399">Architecture <b>en couches</b> prête pour la couche IA</div>
</div>

</div>

<div>

### Difficultés & apprentissages

<div class="text-sm flex flex-col gap-2">
  <div class="mm-card">Modéliser une anti-fraude <b>impossible à contourner côté client</b></div>
  <div class="mm-card">Garder la <b>parité web / mobile</b> sans dupliquer la logique</div>
  <div class="mm-card">Discipline <b>TDD</b> sur les règles métier sensibles</div>
</div>

<div class="mm-card mt-3 text-xs" style="border-color:#fbbf24">
<b style="color:#fbbf24">Suite :</b> CI automatisée, logs/RGPD, puis la couche IA (transcription · RAG · chat).
</div>

</div>

</div>

<!--
[~60 s] En synthèse, mes satisfactions : une API unique propre, consommée par le web et le mobile en miroir ; une anti-triche robuste et, surtout, prouvée par les tests ; et une architecture en couches qui reste prête à accueillir la couche IA. Mes difficultés et apprentissages, honnêtement : la plus marquante a été de modéliser une anti-fraude impossible à contourner côté client — ça m'a obligé à penser « le client est hostile par défaut ». Ensuite, garder la parité web/mobile sans dupliquer la logique, et tenir la discipline TDD sur les règles sensibles. La suite est claire et déjà cadrée en issues : automatiser la CI, livrer les logs et le RGPD, finaliser le bout-en-bout de la progression, puis ouvrir la couche IA. Je voulais montrer un projet vivant, avec un cap assumé, pas un projet figé.
-->

---
layout: center
class: text-center
---

# Démo — comptes de test

<div class="grid grid-cols-2 gap-12 mt-4 justify-items-center">

<div class="flex flex-col items-center">
  <div class="mm-chip" style="color:#c084fc">Formateur</div>
  <QRCode
    class="mt-3"
    :width="190" :height="190" type="svg"
    data="http://localhost:4200/login?role=teacher"
    :margin="6"
    :dotsOptions="{ type: 'extra-rounded', color: '#c084fc' }"
    :backgroundOptions="{ color: '#ffffff' }"
  />
  <div class="text-xs font-mono mt-3 opacity-80">prof@monto.test · Prof123!</div>
</div>

<div class="flex flex-col items-center">
  <div class="mm-chip" style="color:#34d399">Élève</div>
  <QRCode
    class="mt-3"
    :width="190" :height="190" type="svg"
    data="http://localhost:4200/login?role=student"
    :margin="6"
    :dotsOptions="{ type: 'extra-rounded', color: '#34d399' }"
    :backgroundOptions="{ color: '#ffffff' }"
  />
  <div class="text-xs font-mono mt-3 opacity-80">eleve@monto.test · Eleve123!</div>
</div>

</div>

<div class="text-xs opacity-50 mt-6">Remplacer <code>localhost:4200</code> par l'URL Vercel le jour de la démo.</div>

<!--
[~60 s — démo live] Place à la démonstration. Je me connecte avec le compte élève — eleve@monto.test — je montre le catalogue, j'ouvre une formation, et je lance une vidéo. Observez l'encart « temps certifié » : à chaque heartbeat de 30 secondes, le temps validé monte côté serveur. Je tente un saut en avant : le lecteur me ramène en arrière, le skip est bloqué. Puis je bascule sur le compte formateur — prof@monto.test — pour montrer le tableau de suivi de ses élèves. Si la démo live pose souci, j'ai des captures de secours dans la présentation. Les QR codes à l'écran pointent vers l'application — il suffira de remplacer localhost par l'URL Vercel le jour J.
-->

---
layout: end
class: text-center
---

# Merci 🙌

Questions / entretien technique

<div class="mt-6 flex justify-center gap-3 text-xs">
  <span class="mm-chip" style="color:#7bd0ff">Backend Laravel</span>
  <span class="mm-chip" style="color:#c084fc">Web Angular</span>
  <span class="mm-chip" style="color:#34d399">Mobile Expo</span>
</div>

<!--
[~15 s] Merci de votre attention. Je suis prêt pour vos questions et l'entretien technique — sur le backend Laravel, le web Angular ou le mobile Expo. Réponses types à préparer : pourquoi Sanctum plutôt que JWT, pourquoi HMAC plutôt qu'un chiffrement, pourquoi le calcul du pourcentage côté client, et comment je relierais ChapterContent à la progression.
-->

