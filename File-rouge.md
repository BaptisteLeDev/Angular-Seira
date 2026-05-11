🎓 Projet fil rouge – Plateforme e-learning nouvelle génération
 
 
 
 
 
1. Vision
 
 
Développer une plateforme e-learning moderne destinée à remplacer Seira, conçue comme un socle pédagogique robuste, traçable et extensible.
L’objectif est double :
 
Offrir aux écoles un outil structurant, mesurable et fiable.
Proposer aux étudiants une expérience d’apprentissage interactive, contrôlée et enrichie par l’IA.
 
 
La plateforme repose sur une API centralisée développée avec Laravel + API Platform, exposée via Swagger/OpenAPI pour garantir interopérabilité, documentation automatique et évolutivité.
 
 
 
🏗️ 2. Architecture technique
 
 
 
Backend
 
 
Framework : Laravel
API RESTful via API Platform
Documentation automatique via Swagger / OpenAPI
Authentification sécurisée (JWT / OAuth2 possible)
Gestion fine des rôles (RBAC)
 
 
 
Frontend
 
 
Interface élève / formateur / école
Lecteur vidéo contrôlé
Système de tracking sécurisé
Intégration IA (transcription + agent conversationnel)
 
 
 
 
👥 3. Rôles et gestion des entités
 
 
 
Utilisateurs
 
 
Trois profils principaux :
 
Administrateur école
Formateur
Élève
 
 
Un utilisateur peut gérer une ou plusieurs écoles.
 
 
 
École
 
 
Une école peut :
 
Créer des matières
Créer des classes
Associer des formateurs
Assigner des élèves à des classes
 
 
 
 
Matière
 
 
Une matière contient :
 
Nom
Référentiel (PDF téléversé)
Attentes pédagogiques
Volume horaire attendu
Classes associées
Liste de contenus vidéo
 
 
 
 
Formateur
 
 
Un formateur peut :
 
Ajouter des vidéos à une matière
Organiser les vidéos en séquence pédagogique
 
 
 
 
🎥 4. Expérience élève
 
 
Lorsqu’un élève se connecte :
 
Il voit les classes qui lui sont attribuées.
Il accède aux matières correspondantes.
Il ouvre un cours.
Il voit la liste des vidéos à visionner.
Il bénéficie d’un suivi en temps réel de sa progression.
 
 
 
 
⏱️ 5. Système de suivi avancé (anti-triche)
 
 
Le temps de visionnage est validé uniquement si :
 
✅ La vidéo est en lecture active
✅ L’onglet navigateur est actif et au premier plan
✅ La vitesse ne dépasse pas 2x
✅ Le temps est validé par un système de clés sécurisées
 
 
 
Mécanisme de sécurisation
 
 
Le serveur génère des clés temporelles dynamiques
Le frontend doit recevoir une clé valide correspondant au segment temporel
Impossible de simuler du temps sans validation serveur
Protection contre :

 
 
Chaque élève possède donc un suivi certifié.
 
 
 
📊 6. Suivi pédagogique
 
 
Suivi accessible pour :
 
L’élève (auto-évaluation)
Le formateur (suivi individuel)
L’école (vision globale)
 
 
Données disponibles :
 
Temps total visionné
Pourcentage par vidéo
Statut (vu / partiellement vu / non vu)
Avancement global par matière
 
 
 
 
🧠 7. Intelligence artificielle intégrée
 
 
Chaque vidéo dispose :
 
D’une transcription automatique
Stockée et indexée
Envoyée à un agent IA
 
 
 
Interface pédagogique enrichie
 
 
À droite de la vidéo :
 
Un chat contextuel
Questions possibles :

 
 
L’IA s’appuie sur :
 
Transcription vidéo
Métadonnées pédagogiques
Référentiel PDF
Historique d’avancement de l’élève
 
 
Cela transforme la plateforme en assistant pédagogique personnalisé.
 
 
 
🔐 8. Sécurité et conformité
 
 
Gestion stricte des rôles
Isolation des écoles
Protection anti-fraude
Logs d’activité
Compatible RGPD
 
 
 
 
🎯 9. Objectifs pédagogiques du projet fil rouge
 
 
Ce projet permet de travailler :
 
Architecture API REST avancée
Gestion des rôles et permissions
Sécurisation applicative
Streaming et tracking vidéo
Synchronisation frontend/backend
Intégration IA (LLM + RAG)
UX orientée apprentissage
Modélisation métier complète
 
 
 
 
🚀 Conclusion
 
 
Cette plateforme ne se limite pas à diffuser des vidéos.
 
Elle :
 
Structure l’enseignement
Garantit la traçabilité réelle
Mesure l’engagement
Intègre l’intelligence artificielle
Centralise la gestion pédagogique
 