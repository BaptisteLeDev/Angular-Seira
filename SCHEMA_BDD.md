# SCHEMA_BDD - Monto V2 (MVP)

Version: 2026-04-16
Source: consolidation de [File-rouge.md](File-rouge.md) + brouillon [Migration.drawio.png](Migration.drawio.png)

## Objectif
Ce schema de classes BDD sert de base de verite pour les migrations Laravel du MVP.

## Decisions validees
- MVP minimal d'abord.
- 1 utilisateur appartient a 1 ecole.
- 1 eleve a 1 classe active.
- Une matiere peut etre partagee entre plusieurs classes.
- Une matiere a 1 formateur principal.
- Chapitres inclus des le MVP.
- Tracking MVP simple (pas de sessions anti-triche detaillees).
- IA (transcription/chat) reportee apres MVP.
- Soft deletes actives sur les entites metier principales.

## Diagramme de classes (Mermaid)

```mermaid
classDiagram
    class School {
      +bigint id
      +string name
      +string slug
      +softDeletes
      +timestamps
    }

    class Classroom {
      +bigint id
      +bigint school_id
      +string level
      +string name
      +string slug
      +softDeletes
      +timestamps
    }

    class User {
      +bigint id
      +bigint school_id
      +bigint classroom_id nullable
      +string first_name
      +string last_name
      +string email
      +string password
      +enum role // admin|teacher|student
      +datetime email_verified_at
      +remember_token
      +timestamps
    }

    class Subject {
      +bigint id
      +bigint school_id
      +bigint teacher_id
      +string name
      +text description
      +string referential_file_path
      +integer expected_hours
      +softDeletes
      +timestamps
    }

    class ClassroomSubject {
      +bigint id
      +bigint classroom_id
      +bigint subject_id
      +timestamps
    }

    class Chapter {
      +bigint id
      +bigint subject_id
      +string title
      +integer sort_order
      +softDeletes
      +timestamps
    }

    class Video {
      +bigint id
      +bigint chapter_id
      +bigint created_by
      +string title
      +text description
      +string source_url
      +integer duration_seconds
      +integer sort_order
      +boolean is_published
      +softDeletes
      +timestamps
    }

    class VideoProgress {
      +bigint id
      +bigint user_id
      +bigint video_id
      +bigint watched_seconds_validated
      +decimal completion_percent
      +enum status // not_started|in_progress|completed
      +datetime last_seen_at
      +timestamps
    }

    School "1" --> "many" Classroom : has
    School "1" --> "many" User : has
    School "1" --> "many" Subject : has

    Classroom "1" --> "many" User : hosts_students
    Classroom "1" --> "many" ClassroomSubject : receives

    User "1" --> "many" Subject : teaches
    User "1" --> "many" Video : uploads
    User "1" --> "many" VideoProgress : tracks

    Subject "1" --> "many" ClassroomSubject : assigned_to
    Subject "1" --> "many" Chapter : contains

    Chapter "1" --> "many" Video : contains
    Video "1" --> "many" VideoProgress : tracked
```

## Contraintes SQL importantes
- `users.email` unique.
- `schools.slug` unique.
- `classrooms` unique composite: `(school_id, slug)`.
- `subjects` unique composite: `(school_id, name)`.
- `classroom_subject` unique composite: `(classroom_id, subject_id)`.
- `chapters` unique composite: `(subject_id, sort_order)`.
- `videos` unique composite: `(chapter_id, sort_order)`.
- `video_progress` unique composite: `(user_id, video_id)`.

## Regles metier MVP
- `users.classroom_id` est obligatoire si `role=student`.
- `users.classroom_id` est null autorise si `role=admin|teacher`.
- `subjects.teacher_id` doit pointer vers un user de role `teacher`.

## Portee post-MVP (deja prevue, non implementee maintenant)
- Anti-triche avancee: `playback_sessions`, `playback_proof_keys`.
- IA: `video_transcripts`, `transcript_chunks`, `ai_conversations`, `ai_messages`.
