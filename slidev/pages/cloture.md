---
layout: section
transition: slide-left
---

# 6 · Veille & conclusion

<!--
**[CLÔTURE]** Dernière partie : veille sécurité, synthèse, difficultés et suite.
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
**[VEILLE SÉCURITÉ]** OWASP comme grille de lecture — chaque axe relié à une réalisation.

- **Broken Access Control** → Gates RBAC + isolation école/classe
- **Business Logic Abuse** → faille centrale du projet, traitée par l'anti-triche complet
- **Mass Assignment** → DTO d'entrée, champs sensibles jamais exposés
- **Auth/token** → Sanctum + `SecureStore` mobile
- Reste à durcir : **logs d'activité** et **conformité RGPD** — tracés en issues GitHub

→ On ne sécurise jamais « une fois pour toutes » — c'est la démarche de veille.
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
**[SYNTHÈSE]** Un projet vivant avec un cap assumé — pas un projet figé.

- **Satisfactions** : API unique propre, anti-triche robuste prouvée par les tests, archi prête pour l'IA
- Difficulté principale : modéliser une anti-fraude impossible à contourner côté client
- Apprentissage clé : "le **client est hostile par défaut**"
- Parité web/mobile sans dupliquer la logique — discipline **TDD** tenue
- Suite cadrée : CI automatisée, logs/RGPD, couche IA

→ Merci — on est prêts pour les questions.
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
**[DÉMO]** Démonstration en live — compte élève puis formateur.

- Connexion `eleve@monto.test` → catalogue → formation → vidéo
- Observer l'encart **« temps certifié »** monter à chaque heartbeat de 30 s
- Tenter un saut en avant : le lecteur **bloque le skip**
- Basculer sur `prof@monto.test` → tableau de suivi des élèves
- Secours : captures dans la présentation si la démo live pose souci

→ Remplacer `localhost:4200` par l'URL Vercel le jour J.
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
**[QUESTIONS]** Prêts pour l'entretien technique — quelques sujets à anticiper.

- Pourquoi **Sanctum** plutôt que JWT ?
- Pourquoi **HMAC** plutôt qu'un chiffrement symétrique ?
- Pourquoi le calcul du pourcentage **côté client** ?
- Comment on relierait `ChapterContent` à la progression ?
-->

