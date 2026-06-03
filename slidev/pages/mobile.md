---
layout: section
transition: slide-left
---

# Focus mobile — Expo / React Native
<div class="text-base opacity-70 mt-2">Stack choisie · Architecture miroir · Features natives</div>

<!--
**[MOBILE]** Zoom sur le client mobile — la stack, l'architecture, les features natives.

- Même API, même structure logique que le web — idiomes React Native
-->

---
layout: default
---

# La stack choisie — et pourquoi

<div class="grid grid-cols-2 gap-6 mt-2 text-sm">

<div class="flex flex-col gap-2">

<div class="mm-card"><b style="color:#34d399">Expo SDK 54 + React Native 0.81</b><br>Toolchain managée : build, OTA, modules natifs prêts à l'emploi — on code la feature, pas la plomberie native.</div>
<div class="mm-card"><b style="color:#34d399">expo-router 6</b><br>Routing <b>file-based</b> (<code>app/</code>) : groupes <code>(auth)</code> / <code>(app)</code> / <code>(public)</code>, deep-linking gratuit.</div>
<div class="mm-card"><b style="color:#c084fc">zustand 5</b><br>Stores légers, même découpage par domaine que les services signals du web.</div>

</div>

<div class="flex flex-col gap-2">

<div class="mm-card"><b style="color:#7bd0ff">uniwind + Tailwind v4</b><br>Mêmes classes utilitaires que le web — un seul vocabulaire de styling sur tout le monorepo.</div>
<div class="mm-card"><b style="color:#7bd0ff">Zod 4</b><br>Mêmes schémas de validation que le web — le contrat API est vérifié des deux côtés.</div>
<div class="mm-card"><b style="color:#f87171">expo-secure-store</b><br>Token Sanctum chiffré dans le Keychain / Keystore — pas en clair sur l'appareil.</div>

</div>

</div>

<div class="mm-card mt-3 text-xs" style="border-color:#fbbf24">
<b style="color:#fbbf24">Critère de choix :</b> maximiser la <b>parité avec le web</b> (Zod, stores par domaine, Tailwind) tout en restant idiomatique React Native — un développeur navigue les deux codebases sans friction.
</div>

<!--
**[STACK]** Chaque brique est choisie pour la parité avec le web.

- **Expo managé** : pas de plomberie native, OTA, modules prêts (video, speech, secure-store)
- **expo-router** : file-based comme Next — groupes `(auth)` / `(app)` / `(public)`
- **zustand** : équivalent léger des stores signals — même découpage par domaine
- **uniwind** : Tailwind v4 sur React Native — un seul vocabulaire de styling
- **SecureStore** : token chiffré Keychain/Keystore, jamais en clair

→ Cette parité se voit dans l'architecture.
-->

---

# Architecture miroir du web

<div class="grid grid-cols-2 gap-6 mt-2">

<div>

```ts {all|1-4|6-11}
// client.ts — client HTTP unique
export class HttpError extends Error { /* … */ }
let unauthorizedHandler: (() => void) | null;
// 401 → déconnexion + redirect, un seul endroit

// formation.store.ts — zustand
export const useFormationStore =
  create<FormationState>((set, get) => ({
    items: [], status: 'idle',
    load: async (force?: boolean) => { /* … */ },
  }));
```

</div>

<div class="text-sm flex flex-col gap-2 mt-2">

<div class="mm-card"><b style="color:#34d399">src/api/</b> — client HTTP centralisé (Bearer, timeout 15 s, <code>HttpError</code> typée) + un fichier par domaine.</div>
<div class="mm-card"><b style="color:#c084fc">src/stores/</b> — zustand : <code>auth</code>, <code>formation</code>, <code>progress</code>, <code>watch-session</code>… mêmes domaines que le web.</div>
<div class="mm-card"><b style="color:#7bd0ff">src/schemas/</b> — Zod : <code>parseHydraCollection</code> en <b>fonction pure</b> (vs opérateur RxJS web) + auto-walk de la pagination Hydra.</div>

<div class="text-xs opacity-60">
Guards : <code>RoleGate</code> / <code>use-role-guard</code> — équivalents mobiles de <code>requireRoles()</code>.
</div>

</div>

</div>

<!--
**[MIROIR]** Même structure logique que le web — seuls les idiomes changent.

- **Client HTTP unique** : Bearer, timeout, `HttpError` typée, handler 401 global — l'équivalent des deux intercepteurs Angular
- **Stores zustand** : mêmes domaines, mêmes responsabilités que les stores signals
- **Zod identique** : fonction pure au lieu d'opérateur RxJS, + auto-walk pagination Hydra
- **RoleGate / use-role-guard** : équivalents de `requireRoles()` côté expo-router

→ Là où le mobile se distingue, c'est sur les features natives.
-->

---

# Features natives — lecteur, PDF, text-to-speech

<div class="grid grid-cols-3 gap-4 mt-3 text-sm">

<div class="mm-card">
<b style="color:#c084fc">🎬 Lecteur contrôlé</b><br>
<code>expo-video</code> (hébergé) + <code>react-native-youtube-iframe</code>.<br>
<span class="text-xs opacity-70">Anti-triche conservé : lecture active, anti-seek, heartbeats vers l'API.</span>
</div>

<div class="mm-card">
<b style="color:#7bd0ff">📄 PDF viewer</b><br>
<code>react-native-webview</code> + viewer <b>pdf.js</b> (Mozilla), plein écran.<br>
<span class="text-xs opacity-70">Supports de cours consultables dans l'app, fallback si URL invalide.</span>
</div>

<div class="mm-card">
<b style="color:#34d399">🔊 Text-to-speech</b><br>
<code>expo-speech</code> — <code>SpeakButton</code> lit les articles markdown (fr-FR).<br>
<span class="text-xs opacity-70">Accessibilité : markdown nettoyé (<code>stripMarkdown</code>), pause / reprise.</span>
</div>

</div>

```tsx {all|3-4|6-9}
// SpeakButton.tsx — lecture audio d'un article
const start = () => {
  const payload = isMarkdown ? stripMarkdown(text) : text;
  if (!payload) return;
  Speech.speak(payload, {
    language: 'fr-FR', rate, pitch,
    onDone: () => setState('idle'),
  });
};
```

<!--
**[FEATURES NATIVES]** Trois exemples où le mobile apporte plus qu'un portage du web.

- **Lecteur** : `expo-video` + YouTube iframe — l'anti-triche (heartbeats, anti-seek) fonctionne aussi sur mobile
- **PDF** : WebView + pdf.js, plein écran — les supports de cours se consultent dans l'app
- **Text-to-speech** : `expo-speech` lit les articles — markdown nettoyé avant lecture, pause/reprise
- TTS = accessibilité réelle : un élève peut écouter un cours en mobilité

→ Aussi : haptique (`expo-haptics`), bannière hors-ligne (`netinfo`), thème clair/sombre persisté.
-->
