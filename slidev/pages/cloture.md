---
layout: section
transition: slide-up
---

# 🗺️ Roadmap & clôture

---

# Graphe des dépendances

```mermaid {scale: 0.56}
flowchart LR
  I18["🛠️ #18 Anti-triche · clés"] --> I22["🌐 #22 Lecteur contrôlé"]
  I18 --> I25["📱 #25 Envoi clés"]
  I15["🛠️ #15 Agrégation"] --> I24["🌐 #24 Dashboards"]
  I20["🛠️ #20 Logs"] --> I21["🛠️ #21 RGPD"]
  I19["🛠️ #19 Multi-écoles"]:::solo
  I23["🌐 #23 Espace élève"]:::solo
  I26["📱 #26 Écran Classes"]:::solo

  classDef hi stroke:#f87171,stroke-width:3px;
  classDef solo stroke-dasharray:4 3,opacity:0.7;
  class I18 hi;
```

<div class="text-xs opacity-60 text-center mt-1">
<b style="color:#f87171">#18</b> est le nœud critique : il débloque l'anti-triche web <em>et</em> mobile.
</div>

---

# Ordre de bataille

<div class="flex flex-col gap-3 mt-4 text-sm">
  <div class="mm-card"><b style="color:#f87171">Lot 1 — Fondation anti-triche</b> · #18 (backend) → puis #22 (web) & #25 (mobile) en parallèle</div>
  <div class="mm-card"><b style="color:#7bd0ff">Lot 2 — Suivi pédagogique</b> · #15 (agrégation) → #24 (dashboards)</div>
  <div class="mm-card"><b style="color:#c084fc">Lot 3 — Parcours & confort</b> · #23 (espace élève) · #26 (écran classes)</div>
  <div class="mm-card"><b style="color:#34d399">Lot 4 — Conformité & multi-tenant</b> · #19 · #20 · #21</div>
</div>

<div class="text-xs opacity-60 mt-4">9 issues · projet GitHub « MontoMaster Roadmap » · périmètre IA traité dans une session ultérieure.</div>

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
    :width="200" :height="200" type="svg"
    data="http://localhost:4200/login?role=teacher"
    :margin="6"
    :dotsOptions="{ type: 'extra-rounded', color: '#c084fc' }"
    :backgroundOptions="{ color: '#ffffff' }"
  />
  <div class="text-xs font-mono mt-3 opacity-80">prof@monto.test<br/>Prof123!</div>
</div>

<div class="flex flex-col items-center">
  <div class="mm-chip" style="color:#34d399">Élève</div>
  <QRCode
    class="mt-3"
    :width="200" :height="200" type="svg"
    data="http://localhost:4200/login?role=student"
    :margin="6"
    :dotsOptions="{ type: 'extra-rounded', color: '#34d399' }"
    :backgroundOptions="{ color: '#ffffff' }"
  />
  <div class="text-xs font-mono mt-3 opacity-80">eleve@monto.test<br/>Eleve123!</div>
</div>

</div>

<div class="text-xs opacity-50 mt-6">Remplacer <code>localhost:4200</code> par l'URL Vercel le jour de la démo.</div>

---
layout: end
class: text-center
---

# Merci 🙌

Questions / discussion

<div class="mt-6 flex justify-center gap-3 text-xs">
  <span class="mm-chip" style="color:#7bd0ff">Backend #18–21</span>
  <span class="mm-chip" style="color:#c084fc">Web #22–24</span>
  <span class="mm-chip" style="color:#34d399">Mobile #25–26</span>
</div>
