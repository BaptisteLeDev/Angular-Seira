# TODO — Plateforme e-learning (remplacement Seira)

> Plateforme pédagogique : écoles → classes → matières → chapitres → vidéos, avec suivi de progression certifié et IA intégrée. API centralisée Laravel + API Platform exposée via Swagger/OpenAPI.

**État vérifié le 2026-06-01** — `[x]` = codé · `[ ]` = à faire · ⚠️ = partiel (détail entre parenthèses).

---

## 🛠️ Backend (Laravel + API Platform)

### Architecture & API
- [x] API RESTful exposée via API Platform *(8 modèles `#[ApiResource]`)*
- [x] Documentation automatique Swagger / OpenAPI *(`config/api-platform.php`, `/api/docs`)*
- [x] Interopérabilité, documentation auto et évolutivité

### Authentification & rôles
- [x] Authentification sécurisée (Sanctum, `/auth/login`, tokens) *(`app/State/Auth/`)*
- [x] Gestion fine des rôles (RBAC) : `admin` / `teacher` / `student` *(30+ Gates dans `AppServiceProvider`)*
- [ ] Un utilisateur peut gérer **plusieurs** écoles *(actuellement `school_id` unique, relation 1-N)*
- [x] Isolation des données entre écoles *(filtrage par `school_id`/`classroom_id` dans les Gates)* — ⚠️ pas de middleware global

### Modèle métier
- [x] **École** : créer matières, créer classes, associer formateurs, assigner élèves *(`School` hasMany Classroom/Subject/User)*
- [x] **Matière** : nom, référentiel PDF, attentes pédagogiques, volume horaire, classes associées (M-N), vidéos *(`Subject`)*
- [x] **Formateur** : ajouter des vidéos à une matière, organiser en séquence *(`teacher_id`, `Chapter.sort_order`)*
- [x] **Élève** : rattachement aux classes attribuées *(`classroom_id`)*

### Téléversement de fichiers
- [x] Stockage des référentiels PDF par matière *(`Subject.referential_file_path`, `ChapterContent` type `pdf`)*
- [x] Gestion des contenus vidéo *(`Video.source_url`, `duration_seconds`)*

### Suivi avancé anti-triche (cœur backend)
- [x] Génération serveur de **clés temporelles dynamiques** *(`WatchTokenService`, HMAC-SHA256)*
- [x] Validation du temps de visionnage par segment via clé valide *(`POST /api/watch-sessions/heartbeat`)*
- [x] Rendre impossible la simulation de temps sans validation serveur *(fenêtre temporelle stricte + anti-replay nonce)*
- [x] Persistance d'un suivi **certifié** par élève *(`watched_seconds_validated` modifiable uniquement via heartbeat)*

### Données de suivi pédagogique (exposition API)
- [x] Temps total visionné *(`VideoProgress.watched_seconds_validated`)*
- [x] Pourcentage par vidéo *(`completion_percent`)*
- [x] Statut (vu / partiellement vu / non vu) *(`status`: not_started/in_progress/completed)*
- [x] Avancement par matière *(agrégeable via `VideoProgress`)*
- [x] Vues agrégées élève / formateur / école *(`GET /api/aggregates/teacher` + `GET /api/aggregates/school`)*

### Sécurité & conformité
- [ ] Logs d'activité *(aucune table audit/activity_log)*
- [ ] Protection anti-fraude *(lié à l'anti-triche, non implémenté)*
- [ ] Conformité RGPD — ⚠️ SoftDeletes présents, pas d'anonymisation ni de routes RGPD

---

## 🤖 IA / Backend IA (LLM + RAG)

- [ ] Transcription automatique de chaque vidéo
- [ ] Stockage et indexation des transcriptions
- [ ] Agent IA conversationnel contextuel
- [ ] RAG (transcription, métadonnées, référentiel PDF, historique élève)
- [ ] Endpoint chat contextuel *(aucune dépendance LLM dans `composer.json`)*

---

## 🌐 Frontend Web (Angular)

### Interfaces par rôle
- [ ] Interface **élève** dédiée — ⚠️ accès via `/dashboard` générique → `/formations`, pas d'espace student propre
- [x] Interface **formateur** *(`/teacher`, `/teacher/classes`, `/teacher/students`)*
- [x] Interface **école / administrateur** *(`/admin`, `/admin/users`, `/schools/*`)*

### Parcours élève
- [ ] Affichage des classes attribuées à l'élève — ⚠️ classes stockées en IRIs, affichage seulement côté prof
- [x] Accès aux matières *(`/formations`, `/formations/{id}`)*
- [x] Ouverture d'un cours *(`/formations/{id}/{articleId}`, navigation prev/next)*
- [x] Liste des vidéos à visionner *(sommaire/programme avec icônes + durée)*
- [ ] Suivi de progression en temps réel *(aucun envoi de progression vidéo)*

### Lecteur vidéo contrôlé (anti-triche côté client)
- [x] Lecteur vidéo *(`shared/ui/video-player.ts`, HTML5 + `controlsList=nodownload`)* — ⚠️ non « contrôlé »
- [ ] Détection lecture active *(pas de listener `play`/`timeupdate`)*
- [ ] Détection onglet actif / premier plan *(pas de `visibilitychange`)*
- [ ] Blocage / invalidation au-delà de 2x
- [ ] Réception et envoi des clés temporelles serveur par segment

### Tableaux de bord de suivi
- [ ] Vue auto-évaluation élève
- [ ] Vue suivi individuel formateur *(`/teacher/students` = liste sans stats)*
- [ ] Vue globale école
- [ ] Affichage : temps total, % par vidéo, statut, avancement par matière — ⚠️ seul le temps total matière s'affiche, % = position dans la liste d'articles

### Interface IA enrichie
- [ ] Chat contextuel à droite de la vidéo *(aucun composant chat/IA)*
- [ ] Questions contextuelles sur le contenu du cours

---

## 📱 Mobile (Expo / React Native)

- [ ] Parcours élève : classes → matières → cours → vidéos — ⚠️ matières/cours/vidéos OK, écran **classes** manquant (`classroom.api.ts` inutilisé)
- [x] Lecteur vidéo contrôlé *(`src/ui/VideoPlayer.tsx`, `expo-video`, vitesse verrouillée à 1x, anti-seek)*
- [x] Détection lecture active + vitesse ≤ 2x *(listener `isPlaying`, `LOCKED_RATE = 1`)* — ⚠️ bypass possible en fullscreen natif
- [ ] Réception / envoi des clés temporelles serveur *(`currentTime` capturé mais non envoyé)*
- [ ] Suivi de progression en temps réel *(aucun store/sync de progression)*
- [ ] Affichage du suivi pédagogique (temps, %, statut, avancement)
- [ ] Chat IA contextuel
- [x] Authentification (token Sanctum + `expo-secure-store`) *(`src/stores/auth.store.ts`)*
- [x] Gestion des rôles (`RoleGate` / `use-role-guard`) *(`src/ui/RoleGate.tsx`)*

---

## 🎯 Objectifs pédagogiques transverses (projet fil rouge)

- [x] Architecture API REST avancée *(API Platform opérationnel)*
- [x] Gestion des rôles et permissions *(Gates + guards web/mobile)*
- [ ] Sécurisation applicative *(partielle : auth OK, anti-fraude/clés à faire)*
- [ ] Streaming et tracking vidéo *(lecture OK, tracking absent)*
- [x] Synchronisation frontend / backend *(schémas Zod + API layer web & mobile)*
- [ ] Intégration IA (LLM + RAG)
- [x] UX orientée apprentissage *(navigation matières/chapitres/articles)*
- [x] Modélisation métier complète *(8 modèles + relations + soft deletes)*
