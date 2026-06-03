<?php

namespace Database\Seeders;

use App\Models\Chapter;
use App\Models\ChapterContent;
use App\Models\ChapterProgress;
use App\Models\Classroom;
use App\Models\School;
use App\Models\Subject;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoProgress;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeder pédagogique « réaliste ».
 *
 * Règles de remplissage :
 *  - 2 écoles (MyDigitalSchool en a le plus), au moins 2 classes chacune ;
 *  - au moins 2 à 3 formations (matières) par classe ;
 *  - exactement 3 chapitres minimum par formation ;
 *  - au moins 3 contenus par chapitre (cours markdown + vidéo + exercice,
 *    auxquels s'ajoutent vidéos et PDF complémentaires).
 *
 * Chaque chapitre porte un vrai support markdown, une vraie vidéo YouTube
 * francophone et (souvent) un vrai PDF public. Toutes les URLs externes ont été
 * vérifiées (YouTube oembed + réponse application/pdf). Aucun upload n'est
 * nécessaire : les PDF sont servis via leur URL publique (champ `source_url`).
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // 1. Écoles -----------------------------------------------------------
        $schools = [];
        foreach ($this->schoolDefinitions() as $definition) {
            $schools[$definition['slug']] = School::factory()->create($definition);
        }

        // 2. Classes ----------------------------------------------------------
        $classrooms = [];
        foreach ($this->classroomDefinitions() as $definition) {
            $classrooms[$definition['slug']] = Classroom::factory()->create([
                'school_id' => $schools[$definition['school']]->id,
                'level' => $definition['level'],
                'name' => $definition['name'],
                'slug' => $definition['slug'],
            ]);
        }

        // 3. Utilisateurs -----------------------------------------------------
        $teachers = [];
        foreach ($this->teacherDefinitions() as $definition) {
            $teacher = User::query()->updateOrCreate(
                ['email' => $definition['email']],
                [
                    'school_id' => $schools[$definition['school']]->id,
                    'name' => $definition['name'],
                    'password' => Hash::make($definition['password']),
                    'role' => User::ROLE_TEACHER,
                    'email_verified_at' => now(),
                ]
            );
            $teacher->schools()->syncWithoutDetaching([$schools[$definition['school']]->id]);
            $teachers[$definition['email']] = $teacher;
        }

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@monto.test'],
            [
                'school_id' => $schools['mydigitalschool-vannes']->id,
                'name' => 'Admin Monto',
                'password' => Hash::make('Admin123!'),
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => now(),
            ]
        );
        $admin->schools()->syncWithoutDetaching([
            $schools['mydigitalschool-vannes']->id,
            $schools['aftec-vannes']->id,
        ]);

        $students = [];
        foreach ($this->studentDefinitions() as $definition) {
            $classroom = $classrooms[$definition['classroom']];
            $student = User::query()->updateOrCreate(
                ['email' => $definition['email']],
                [
                    'school_id' => $classroom->school_id,
                    'classroom_id' => $classroom->id,
                    'name' => $definition['name'],
                    'password' => Hash::make($definition['password']),
                    'role' => User::ROLE_STUDENT,
                    'email_verified_at' => now(),
                ]
            );
            $student->schools()->syncWithoutDetaching([$classroom->school_id]);
            $students[$definition['classroom']] = $student;
        }

        // 4. Cours (matières → chapitres → vidéo + contenus) ------------------
        foreach ($this->courseDefinitions() as $course) {
            $teacher = $teachers[$course['teacher']];

            $subject = Subject::factory()->create([
                'school_id' => $schools[$course['school']]->id,
                'teacher_id' => $teacher->id,
                'name' => $course['name'],
                'description' => $course['description'],
                'referential_file_path' => $course['referential'] ?? null,
                'expected_hours' => $course['expected_hours'],
            ]);

            foreach ($course['classrooms'] as $classroomSlug) {
                $subject->classrooms()->syncWithoutDetaching($classrooms[$classroomSlug]->id);
            }

            // Élève qui suivra ce cours (1re classe rattachée qui possède un élève).
            $progressStudent = null;
            foreach ($course['classrooms'] as $classroomSlug) {
                if (isset($students[$classroomSlug])) {
                    $progressStudent = $students[$classroomSlug];
                    break;
                }
            }

            foreach ($course['chapters'] as $chapterIndex => $chapterDefinition) {
                $chapter = Chapter::factory()->create([
                    'subject_id' => $subject->id,
                    'title' => $chapterDefinition['title'],
                    'sort_order' => $chapterIndex + 1,
                ]);

                $video = $this->seedChapterContents($chapter, $teacher, $chapterDefinition);

                // Progression de l'élève (2 premiers chapitres de chaque cours).
                if ($progressStudent !== null && $chapterIndex < 2) {
                    $this->seedProgress($progressStudent, $chapter, $video, $chapterIndex === 0);
                }
            }
        }
    }

    /**
     * Crée la vidéo principale et tous les contenus d'un chapitre.
     *
     * Ordre des contenus : cours markdown → vidéo principale → vidéos
     * complémentaires → PDF → exercice. Un filet de sécurité garantit au moins
     * 3 contenus par chapitre.
     *
     * @param array<string, mixed> $chapterDefinition
     */
    private function seedChapterContents(Chapter $chapter, User $teacher, array $chapterDefinition): Video
    {
        $mainVideo = $chapterDefinition['video'];

        $video = Video::factory()->create([
            'chapter_id' => $chapter->id,
            'created_by' => $teacher->id,
            'title' => $mainVideo['title'],
            'description' => $mainVideo['description'] ?? 'Vidéo principale du chapitre.',
            'source_url' => $mainVideo['url'],
            'duration_seconds' => $mainVideo['duration'],
            'sort_order' => 1,
            'is_published' => true,
        ]);

        $order = 0;

        // Cours markdown.
        $this->makeContent($chapter, $teacher, ++$order, [
            'type' => 'markdown',
            'title' => 'Cours — '.$chapterDefinition['title'],
            'description' => 'Support de cours détaillé.',
            'content' => $chapterDefinition['markdown'],
        ]);

        // Vidéo principale (rejouée dans le fil de contenus).
        $this->makeContent($chapter, $teacher, ++$order, [
            'type' => 'video',
            'title' => $mainVideo['title'],
            'description' => $mainVideo['description'] ?? 'Vidéo principale du chapitre.',
            'source_url' => $mainVideo['url'],
            'duration_seconds' => $mainVideo['duration'],
        ]);

        // Vidéos complémentaires.
        foreach ($chapterDefinition['extra_videos'] ?? [] as $extraVideo) {
            $this->makeContent($chapter, $teacher, ++$order, [
                'type' => 'video',
                'title' => $extraVideo['title'],
                'description' => $extraVideo['description'] ?? 'Vidéo complémentaire.',
                'source_url' => $extraVideo['url'],
                'duration_seconds' => $extraVideo['duration'],
            ]);
        }

        // Ressource PDF publique.
        if (isset($chapterDefinition['pdf'])) {
            $this->makeContent($chapter, $teacher, ++$order, [
                'type' => 'pdf',
                'title' => $chapterDefinition['pdf']['title'],
                'description' => $chapterDefinition['pdf']['description'] ?? 'Ressource PDF de référence.',
                'source_url' => $chapterDefinition['pdf']['url'],
            ]);
        }

        // Exercice (markdown).
        if (isset($chapterDefinition['exercise'])) {
            $this->makeContent($chapter, $teacher, ++$order, [
                'type' => 'markdown',
                'title' => 'À pratiquer — '.$chapterDefinition['title'],
                'description' => 'Exercice d\'application.',
                'content' => $chapterDefinition['exercise'],
            ]);
        }

        // Filet de sécurité : au moins 3 contenus par chapitre.
        while ($order < 3) {
            $this->makeContent($chapter, $teacher, ++$order, [
                'type' => 'markdown',
                'title' => 'Synthèse — '.$chapterDefinition['title'],
                'description' => 'Points clés à retenir.',
                'content' => "# À retenir — {$chapterDefinition['title']}\n\nRévisez les notions clés de ce chapitre et reformulez-les avec vos propres mots.",
            ]);
        }

        return $video;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    private function makeContent(Chapter $chapter, User $teacher, int $sortOrder, array $attributes): void
    {
        ChapterContent::factory()->create(array_merge([
            'chapter_id' => $chapter->id,
            'created_by' => $teacher->id,
            'content' => null,
            'source_url' => null,
            'file_path' => null,
            'duration_seconds' => 0,
            'sort_order' => $sortOrder,
            'is_published' => true,
        ], $attributes));
    }

    private function seedProgress(User $student, Chapter $chapter, Video $video, bool $completed): void
    {
        VideoProgress::query()->updateOrCreate(
            ['user_id' => $student->id, 'video_id' => $video->id],
            [
                'watched_seconds_validated' => $completed ? $video->duration_seconds : (int) round($video->duration_seconds * 0.4),
                'completion_percent' => $completed ? 100 : 40,
                'status' => $completed ? 'completed' : 'in_progress',
                'last_seen_at' => now(),
            ]
        );

        ChapterProgress::query()->updateOrCreate(
            ['user_id' => $student->id, 'chapter_id' => $chapter->id],
            [
                'completion_percent' => $completed ? 100 : 40,
                'status' => $completed ? 'completed' : 'in_progress',
                'last_seen_at' => now(),
            ]
        );
    }

    /** @return array<int, array{name: string, slug: string}> */
    private function schoolDefinitions(): array
    {
        return [
            ['name' => 'MyDigitalSchool Vannes', 'slug' => 'mydigitalschool-vannes'],
            ['name' => 'AFTEC Vannes', 'slug' => 'aftec-vannes'],
        ];
    }

    /** @return array<int, array{school: string, level: string, name: string, slug: string}> */
    private function classroomDefinitions(): array
    {
        return [
            // MyDigitalSchool : 3 classes.
            ['school' => 'mydigitalschool-vannes', 'level' => 'B3', 'name' => 'B3 Développeur Web', 'slug' => 'b3-developpeur-web'],
            ['school' => 'mydigitalschool-vannes', 'level' => 'M1', 'name' => 'M1 Design UX/UI', 'slug' => 'm1-design-ux-ui'],
            ['school' => 'mydigitalschool-vannes', 'level' => 'B1', 'name' => 'B1 Cycle Web', 'slug' => 'b1-cycle-web'],
            // AFTEC : 2 classes (com / réseaux sociaux / marketing).
            ['school' => 'aftec-vannes', 'level' => 'B3', 'name' => 'B3 Marketing Digital', 'slug' => 'b3-marketing-digital'],
            ['school' => 'aftec-vannes', 'level' => 'B2', 'name' => 'B2 Communication & Réseaux Sociaux', 'slug' => 'b2-communication-reseaux'],
        ];
    }

    /** @return array<int, array{email: string, name: string, password: string, school: string}> */
    private function teacherDefinitions(): array
    {
        return [
            ['email' => 'prof@monto.test', 'name' => 'Prof Monto', 'password' => 'Prof123!', 'school' => 'mydigitalschool-vannes'],
            ['email' => 'prof.market@monto.test', 'name' => 'Camille Marketing', 'password' => 'Prof123!', 'school' => 'aftec-vannes'],
        ];
    }

    /** @return array<int, array{email: string, name: string, password: string, classroom: string}> */
    private function studentDefinitions(): array
    {
        return [
            ['email' => 'eleve@monto.test', 'name' => 'Eleve Monto', 'password' => 'Eleve123!', 'classroom' => 'b3-developpeur-web'],
            ['email' => 'eleve.design@monto.test', 'name' => 'Léa Design', 'password' => 'Eleve123!', 'classroom' => 'm1-design-ux-ui'],
            ['email' => 'eleve.b1@monto.test', 'name' => 'Tom Cycle Web', 'password' => 'Eleve123!', 'classroom' => 'b1-cycle-web'],
            ['email' => 'eleve.market@monto.test', 'name' => 'Inès Marketing', 'password' => 'Eleve123!', 'classroom' => 'b3-marketing-digital'],
            ['email' => 'eleve.com@monto.test', 'name' => 'Hugo Communication', 'password' => 'Eleve123!', 'classroom' => 'b2-communication-reseaux'],
        ];
    }

    /**
     * Catalogue complet des cours.
     *
     * @return array<int, array<string, mixed>>
     */
    private function courseDefinitions(): array
    {
        return array_merge(
            $this->devCourses(),
            $this->designCourses(),
            $this->discoveryCourses(),
            $this->marketingCourses(),
            $this->communicationCourses(),
        );
    }

    // ====================================================================
    //  DÉVELOPPEMENT — MyDigitalSchool (B3 Dev, partiellement B1 Cycle Web)
    // ====================================================================

    /** @return array<int, array<string, mixed>> */
    private function devCourses(): array
    {
        return [
            [
                'school' => 'mydigitalschool-vannes',
                'teacher' => 'prof@monto.test',
                'name' => 'Intégration HTML & CSS',
                'description' => 'Structurer une page en HTML5 sémantique et la mettre en page avec les modèles modernes Flexbox et Grid, jusqu\'au responsive et à l\'accessibilité.',
                'expected_hours' => 42,
                'classrooms' => ['b3-developpeur-web', 'b1-cycle-web'],
                'chapters' => [
                    [
                        'title' => 'Structurer une page en HTML5',
                        'video' => [
                            'title' => 'Apprendre l\'HTML : Introduction',
                            'description' => 'Les fondations du HTML par Grafikart.',
                            'url' => 'https://www.youtube.com/watch?v=oEAuNzWXRjM',
                            'duration' => 720,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Apprendre l\'HTML : TP — Créer ses premières pages',
                                'description' => 'Mise en pratique guidée.',
                                'url' => 'https://www.youtube.com/watch?v=vj-5-_h_E8w',
                                'duration' => 1200,
                            ],
                        ],
                        'pdf' => [
                            'title' => 'HTML Cheat Sheet',
                            'description' => 'Aide-mémoire complet des balises HTML5.',
                            'url' => 'https://html.com/wp-content/uploads/html-cheat-sheet.pdf',
                        ],
                        'markdown' => <<<'MD'
# Structurer une page en HTML5

## Objectifs
- Comprendre le rôle du HTML dans le trio HTML / CSS / JS.
- Écrire un document HTML5 valide et **sémantique**.
- Connaître les balises de structure et de contenu essentielles.

## Le squelette d'un document
```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ma page</title>
  </head>
  <body>
    <!-- contenu visible -->
  </body>
</html>
```
La balise `<!DOCTYPE html>` déclare la version (HTML5). `lang="fr"` aide les lecteurs d'écran et le SEO. `<meta charset>` évite les caractères cassés (é, à, ç).

## La sémantique, pas seulement des `<div>`
On structure le contenu avec des balises qui **portent du sens** :

| Balise | Rôle |
| --- | --- |
| `<header>` | En-tête (logo, navigation) |
| `<nav>` | Menu de navigation |
| `<main>` | Contenu principal (unique) |
| `<article>` | Contenu autonome (un billet, une fiche) |
| `<section>` | Regroupement thématique |
| `<aside>` | Contenu annexe |
| `<footer>` | Pied de page |

> La sémantique améliore l'**accessibilité**, le **référencement** et la lisibilité du code.

## Les contenus de base
- Titres hiérarchisés `<h1>` → `<h6>` (un seul `<h1>` par page).
- Paragraphes `<p>`, listes `<ul>` / `<ol>` / `<li>`.
- Liens `<a href="…">`, images `<img src="…" alt="…">` (l'attribut `alt` est obligatoire).
- Formulaires `<form>`, `<label>`, `<input>`, `<button>`.

## À retenir
- Un document HTML décrit une **structure**, pas une apparence (c'est le rôle du CSS).
- Toujours associer un `<label>` à un champ et un `alt` à une image.
- Valider son code avec le [validateur du W3C](https://validator.w3.org/).
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Structurer une page en HTML5

## Exercice
Crée une page « Mon CV » 100 % sémantique :
1. Un `<header>` avec ton nom (`<h1>`) et un `<nav>`.
2. Un `<main>` contenant deux `<section>` : « Expériences » et « Formations ».
3. Un `<footer>` avec un lien `<a>` vers ton e-mail (`mailto:`).

## Critères de réussite
- Aucune `<div>` utilisée à la place d'une balise sémantique.
- La page passe le [validateur W3C](https://validator.w3.org/) sans erreur.
MD,
                    ],
                    [
                        'title' => 'Mettre en page avec Flexbox & Grid',
                        'video' => [
                            'title' => 'Découverte du CSS : Flexbox',
                            'description' => 'Le modèle Flexbox expliqué par Grafikart.',
                            'url' => 'https://www.youtube.com/watch?v=9gZugKEczJ0',
                            'duration' => 900,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Découverte du CSS : Float, Flex ou Grid ?',
                                'description' => 'Choisir la bonne méthode de mise en page.',
                                'url' => 'https://www.youtube.com/watch?v=DmFkrYbnFwY',
                                'duration' => 780,
                            ],
                        ],
                        'pdf' => [
                            'title' => 'CSS Cheat Sheet',
                            'description' => 'Sélecteurs, box model, positionnement.',
                            'url' => 'https://cheatography.com/davechild/cheat-sheets/css2/pdf/',
                        ],
                        'markdown' => <<<'MD'
# Mettre en page avec Flexbox & Grid

## Le box model
Chaque élément est une boîte : `content` → `padding` → `border` → `margin`.
```css
.carte {
  padding: 1rem;          /* espace intérieur */
  border: 1px solid #ddd; /* bordure */
  margin: 0.5rem;         /* espace extérieur */
  box-sizing: border-box; /* la largeur inclut padding + border */
}
```

## Flexbox : aligner sur **un** axe
Idéal pour une barre de navigation, une rangée de cartes, centrer un élément.
```css
.barre {
  display: flex;
  justify-content: space-between; /* axe principal (horizontal) */
  align-items: center;            /* axe secondaire (vertical) */
  gap: 1rem;
}
```

## Grid : organiser sur **deux** axes
Idéal pour une grille de contenu, un layout de page complet.
```css
.grille {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 colonnes égales */
  gap: 1.5rem;
}
```

## Quand utiliser quoi ?
- **Flexbox** : contenu d'une dimension (une ligne *ou* une colonne).
- **Grid** : mise en page en deux dimensions (lignes *et* colonnes).
- Les deux se combinent très bien (Grid pour la page, Flexbox dans les composants).

## À retenir
- `gap` remplace avantageusement les marges entre éléments.
- `1fr` = une fraction de l'espace disponible.
- On évite aujourd'hui le positionnement par `float` pour la mise en page.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Flexbox & Grid

## Exercice
1. Crée une barre de navigation en **Flexbox** : logo à gauche, liens à droite.
2. Crée une galerie de 6 cartes en **Grid** : 3 colonnes sur desktop, qui se réorganisent automatiquement.
3. Centre un bloc « bienvenue » horizontalement **et** verticalement dans l'écran.

## Indice
`place-items: center;` sur un conteneur en `display: grid;` centre sur les deux axes.
MD,
                    ],
                    [
                        'title' => 'Responsive & mobile first',
                        'video' => [
                            'title' => 'Découverte du CSS : Media query et le « responsive »',
                            'description' => 'Adapter une page à toutes les tailles d\'écran.',
                            'url' => 'https://www.youtube.com/watch?v=wu1Sk8iOPnE',
                            'duration' => 780,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Tutoriel CSS : Responsive, Mobile First',
                                'description' => 'La méthode mobile first appliquée.',
                                'url' => 'https://www.youtube.com/watch?v=_cueUCN9XtA',
                                'duration' => 1200,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Responsive & mobile first

## Pourquoi le responsive ?
Plus de la moitié du trafic web vient du mobile. Une page **responsive**
s'adapte à la largeur de l'écran plutôt que d'imposer une mise en page fixe.

## La balise viewport (indispensable)
```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```
Sans elle, le mobile « dézoome » la page de bureau.

## Les media queries
```css
/* Style de base : mobile */
.colonnes { display: block; }

/* À partir de 768px : tablette / desktop */
@media (min-width: 768px) {
  .colonnes { display: flex; gap: 2rem; }
}
```

## L'approche « mobile first »
1. On écrit d'abord le style pour le **petit écran** (le plus simple).
2. On **enrichit** ensuite avec des `@media (min-width: …)`.

C'est plus performant et force à hiérarchiser le contenu essentiel.

## Unités adaptables
- `rem` / `em` : tailles relatives à la police.
- `%`, `vw`, `vh` : relatives au conteneur ou à l'écran.
- `clamp(min, idéal, max)` pour des tailles fluides.

## À retenir
- Commencer petit, agrandir avec les media queries.
- Tester sur plusieurs largeurs (les outils de développement du navigateur le permettent).
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Responsive & mobile first

## Exercice
Reprends ta galerie de cartes et rends-la responsive en **mobile first** :
1. 1 colonne par défaut (mobile).
2. 2 colonnes à partir de `600px`.
3. 3 colonnes à partir de `900px`.

## Bonus
Utilise `clamp()` pour que la taille du titre principal varie de façon fluide entre `1.5rem` et `3rem`.
MD,
                    ],
                    [
                        'title' => 'Accessibilité web (a11y)',
                        'video' => [
                            'title' => 'Tutoriel CSS/HTML : Menu d\'accessibilité',
                            'description' => 'Rendre une interface accessible.',
                            'url' => 'https://www.youtube.com/watch?v=UeQ5T8NbE7A',
                            'duration' => 900,
                        ],
                        'pdf' => [
                            'title' => 'WebAIM — WCAG 2 Checklist',
                            'description' => 'Liste de contrôle d\'accessibilité WCAG 2.',
                            'url' => 'https://webaim.org/standards/wcag/WCAG2Checklist.pdf',
                        ],
                        'markdown' => <<<'MD'
# Accessibilité web (a11y)

## De quoi parle-t-on ?
L'accessibilité (**a11y**) garantit qu'une personne en situation de handicap
peut utiliser un site : lecteurs d'écran, navigation clavier, contraste, etc.
En France, le **RGAA** rend l'accessibilité obligatoire pour de nombreux sites.

## Les 4 principes (POUR)
- **P**erceptible : alternatives textuelles, contraste suffisant.
- **O**pérable : tout doit fonctionner au clavier.
- **U**tilisable / compréhensible : libellés clairs, comportements prévisibles.
- **R**obuste : code valide, compatible avec les technologies d'assistance.

## Gestes concrets
```html
<!-- Toujours un alt pertinent -->
<img src="graphique.png" alt="Ventes 2024 : +18 %" />

<!-- Associer label et champ -->
<label for="email">E-mail</label>
<input id="email" type="email" />

<!-- Un bouton est un <button>, pas un <div> cliquable -->
<button type="submit">Envoyer</button>
```

## Le contraste
Le ratio texte/fond doit être d'au moins **4.5:1** pour le texte normal.

## Navigation clavier
- L'ordre de tabulation suit l'ordre du DOM.
- Le focus doit rester **visible** (`:focus-visible`).
- Un lien « aller au contenu » aide à sauter la navigation.

## À retenir
- L'accessibilité profite à **tout le monde** (mobile, contexte bruyant, SEO).
- Utiliser le HTML sémantique fait déjà 80 % du travail.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Accessibilité web

## Exercice
Audite une de tes pages avec cette checklist rapide :
1. Toutes les images ont-elles un `alt` pertinent ?
2. Peux-tu naviguer et activer tous les liens/boutons **au clavier** (Tab + Entrée) ?
3. Le focus est-il visible ?
4. Le contraste texte/fond passe-t-il (teste sur [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)) ?

## Livrable
Liste les 3 problèmes les plus graves trouvés et corrige-les.
MD,
                    ],
                ],
            ],
            [
                'school' => 'mydigitalschool-vannes',
                'teacher' => 'prof@monto.test',
                'name' => 'JavaScript & interactivité',
                'description' => 'Du langage JavaScript (variables, fonctions, modules) à la manipulation du DOM pour rendre une page vivante.',
                'expected_hours' => 38,
                'classrooms' => ['b3-developpeur-web'],
                'chapters' => [
                    [
                        'title' => 'Variables, types & opérateurs',
                        'video' => [
                            'title' => 'Apprendre le JavaScript : Les variables',
                            'description' => 'Déclarer et utiliser des variables en JS.',
                            'url' => 'https://www.youtube.com/watch?v=GU8kxJ3P67I',
                            'duration' => 720,
                        ],
                        'pdf' => [
                            'title' => 'JavaScript Cheat Sheet (débutant)',
                            'description' => 'Aide-mémoire des bases du langage.',
                            'url' => 'https://websitesetup.org/wp-content/uploads/2020/09/Javascript-Cheat-Sheet.pdf',
                        ],
                        'markdown' => <<<'MD'
# Variables, types & opérateurs

## Déclarer une variable
```js
const pi = 3.14;   // constante : ne change pas
let score = 0;     // variable : peut changer
score = score + 1; // réaffectation
```
On utilise `const` par défaut, `let` si la valeur doit évoluer. On évite `var`.

## Les types primitifs
- `string` : `"Bonjour"`, `'Salut'`, `` `Coucou ${nom}` ``
- `number` : `42`, `3.14`
- `boolean` : `true` / `false`
- `null`, `undefined`
- `object` et `array` pour les structures complexes

```js
const eleve = { nom: 'Léa', age: 20 };   // objet
const notes = [12, 15, 18];              // tableau
console.log(eleve.nom, notes[0]);        // Léa 12
```

## Opérateurs utiles
- Arithmétiques : `+ - * / %`
- Comparaison **stricte** : `===` et `!==` (compare valeur **et** type)
- Logiques : `&&`, `||`, `!`
- Ternaire : `const message = score > 10 ? 'Réussi' : 'À revoir';`

## À retenir
- Préférer `===` à `==` (qui fait des conversions piégeuses).
- Les *template literals* (`` `…${}` ``) simplifient la concaténation.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Variables & types

## Exercice
Dans la console du navigateur :
1. Déclare `const prenom` et `let age`.
2. Crée un objet `eleve` avec `prenom`, `age` et un tableau `notes`.
3. Calcule et affiche la **moyenne** des notes.
4. Affiche `"Reçu"` ou `"À revoir"` selon que la moyenne est ≥ 10 (opérateur ternaire).

## Indice
`notes.reduce((t, n) => t + n, 0) / notes.length`
MD,
                    ],
                    [
                        'title' => 'Les fonctions',
                        'video' => [
                            'title' => 'Apprendre le JavaScript : Les fonctions',
                            'description' => 'Déclarer et appeler des fonctions.',
                            'url' => 'https://www.youtube.com/watch?v=EvHAiskwHvE',
                            'duration' => 900,
                        ],
                        'markdown' => <<<'MD'
# Les fonctions

## Déclarer une fonction
```js
function additionner(a, b) {
  return a + b;
}
additionner(2, 3); // 5
```

## Les fonctions fléchées
Syntaxe concise, très utilisée avec les tableaux :
```js
const doubler = (n) => n * 2;
const nombres = [1, 2, 3];
const doubles = nombres.map(doubler); // [2, 4, 6]
```

## Paramètres par défaut & rest
```js
function saluer(nom = 'invité') {
  return `Bonjour ${nom}`;
}
function somme(...valeurs) {
  return valeurs.reduce((total, n) => total + n, 0);
}
somme(1, 2, 3); // 6
```

## Portée (scope)
Une variable déclarée dans une fonction n'existe **que** dans cette fonction.
Les fonctions peuvent retourner une valeur (`return`) ou produire un effet
(afficher, modifier le DOM…).

## À retenir
- Une fonction = un bloc réutilisable qui fait **une** chose.
- `map`, `filter`, `reduce` parcourent les tableaux sans boucle explicite.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Les fonctions

## Exercice
Écris ces fonctions, en version classique **puis** en fonction fléchée :
1. `estPair(n)` → renvoie `true` si `n` est pair.
2. `filtrerReçus(notes)` → renvoie les notes ≥ 10 (avec `filter`).
3. `messageBienvenue(nom = 'invité')` → renvoie `"Bonjour {nom}"`.

## Bonus
Combine `filter` + `map` pour obtenir les notes reçues, doublées.
MD,
                    ],
                    [
                        'title' => 'Organiser son code avec les modules',
                        'video' => [
                            'title' => 'Tutoriel JavaScript : Les modules',
                            'description' => 'import / export pour structurer un projet.',
                            'url' => 'https://www.youtube.com/watch?v=Bjuai6iNjYA',
                            'duration' => 960,
                        ],
                        'markdown' => <<<'MD'
# Organiser son code avec les modules

## Pourquoi des modules ?
Au-delà de quelques dizaines de lignes, un seul fichier devient illisible. Les
**modules ES** permettent de découper le code en fichiers réutilisables.

## Exporter
```js
// math.js
export function additionner(a, b) {
  return a + b;
}
export const PI = 3.14159;
```

## Importer
```js
// app.js
import { additionner, PI } from './math.js';
console.log(additionner(2, 3), PI);
```

## Export par défaut
```js
// bouton.js
export default function creerBouton(texte) { /* … */ }

// app.js
import creerBouton from './bouton.js';
```

## Bonnes pratiques
- Un module = une responsabilité claire.
- Nommer les fichiers de façon explicite.
- Côté navigateur : `<script type="module" src="app.js"></script>`.

## À retenir
- `export` rend disponible, `import` consomme.
- Les modules ont leur propre portée (pas de variables globales involontaires).
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Les modules

## Exercice
Découpe un mini-projet en 3 fichiers :
1. `panier.js` : exporte `ajouter(article)` et `total()`.
2. `format.js` : exporte par défaut une fonction `formaterPrix(n)` → `"12,00 €"`.
3. `app.js` : importe les deux et affiche le total formaté.

## Rappel
Active les modules avec `<script type="module" src="app.js"></script>`.
MD,
                    ],
                ],
            ],
            [
                'school' => 'mydigitalschool-vannes',
                'teacher' => 'prof@monto.test',
                'name' => 'Git & travail en équipe',
                'description' => 'Versionner son code avec Git et collaborer efficacement sur GitHub (branches, commits, pull requests).',
                'expected_hours' => 22,
                'classrooms' => ['b3-developpeur-web', 'b1-cycle-web'],
                'chapters' => [
                    [
                        'title' => 'Qu\'est-ce que Git ?',
                        'video' => [
                            'title' => 'Comprendre Git : Qu\'est-ce que git ?',
                            'description' => 'Le concept de gestion de versions.',
                            'url' => 'https://www.youtube.com/watch?v=rP3T0Ee6pLU',
                            'duration' => 540,
                        ],
                        'pdf' => [
                            'title' => 'Git Cheat Sheet (GitHub Education)',
                            'description' => 'Aide-mémoire officiel des commandes Git.',
                            'url' => 'https://education.github.com/git-cheat-sheet-education.pdf',
                        ],
                        'markdown' => <<<'MD'
# Qu'est-ce que Git ?

## Le problème résolu
Sans gestion de versions : `projet_final_v2_vraiment_final.zip`. Avec **Git**,
on garde un historique propre, on revient en arrière et on travaille à plusieurs
sans s'écraser mutuellement.

## Les 3 zones
```
Working Directory  →  Staging Area  →  Repository
   (tes fichiers)      (git add)        (git commit)
```

## Les commandes de base
```bash
git init                 # créer un dépôt
git status               # voir l'état des fichiers
git add fichier.html     # préparer un fichier
git commit -m "Message"  # enregistrer un instantané
git log --oneline        # consulter l'historique
```

## Anatomie d'un bon commit
- **Atomique** : une intention par commit.
- **Message clair** à l'impératif : « Ajoute le formulaire de contact ».

## À retenir
- Git suit les **changements**, pas seulement les fichiers.
- Un commit est un point de sauvegarde auquel on peut toujours revenir.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Premiers pas Git

## Exercice
1. Crée un dossier, lance `git init`.
2. Ajoute un fichier `README.md`, fais un premier commit.
3. Modifie-le, observe `git status`, puis commit à nouveau.
4. Affiche l'historique avec `git log --oneline`.

## Question
Quelle est la différence entre `git add` et `git commit` ?
MD,
                    ],
                    [
                        'title' => 'Premiers commits & collaboration',
                        'video' => [
                            'title' => 'Comprendre Git : Premiers commits',
                            'description' => 'Réaliser ses premiers commits.',
                            'url' => 'https://www.youtube.com/watch?v=chhVBZfRFgI',
                            'duration' => 600,
                        ],
                        'markdown' => <<<'MD'
# Premiers commits & collaboration

## Travailler avec un dépôt distant (GitHub)
```bash
git clone https://github.com/org/projet.git
git pull            # récupérer les changements des autres
git push            # envoyer ses commits
```

## Le dépôt distant (`remote`)
`origin` est le nom par défaut du dépôt distant. On peut le consulter avec
`git remote -v`. `git push -u origin main` lie la branche locale à la distante.

## Le fichier `.gitignore`
Certains fichiers ne doivent **jamais** être versionnés (dépendances, secrets) :
```
node_modules/
.env
dist/
```

## À retenir
- `pull` avant de commencer, `push` après avoir commité.
- Ne jamais versionner ses secrets (`.env`) ni `node_modules`.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Dépôt distant

## Exercice
1. Crée un dépôt vide sur GitHub.
2. Lie ton dépôt local : `git remote add origin <url>`.
3. Pousse ton travail : `git push -u origin main`.
4. Ajoute un `.gitignore` excluant `node_modules/` et `.env`.

## Vérification
Le fichier `.env` n'apparaît **pas** sur GitHub.
MD,
                    ],
                    [
                        'title' => 'Branches, fork & pull requests',
                        'video' => [
                            'title' => 'Comprendre Git : Les branches',
                            'description' => 'Créer et fusionner des branches.',
                            'url' => 'https://www.youtube.com/watch?v=THsj6g_kG10',
                            'duration' => 660,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Comprendre Git : Fork & Pull request',
                                'description' => 'Collaborer via une pull request.',
                                'url' => 'https://www.youtube.com/watch?v=D5QGiIM1j20',
                                'duration' => 1560,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Branches, fork & pull requests

## La branche
Une branche isole un travail (fonctionnalité, correctif) sans perturber la
branche principale (`main`).
```bash
git switch -c feat/formulaire   # créer + basculer
# … on code, on commit …
git switch main
git merge feat/formulaire       # intégrer
```

## La pull request (PR)
Sur GitHub, on ouvre une **PR** pour proposer ses changements. L'équipe relit
(*code review*), commente, puis fusionne. C'est le cœur de la collaboration.

## Le fork
Sur un projet dont on n'est pas membre (open source), on **fork** (copie
personnelle), on travaille sur une branche, puis on propose une PR vers le
projet d'origine.

## Résoudre un conflit
Quand deux personnes modifient les mêmes lignes, Git signale un **conflit** :
on choisit la bonne version entre les marqueurs `<<<<<<<` et `>>>>>>>`.

## À retenir
- Une branche par fonctionnalité, une PR par branche.
- Le fork + PR est le modèle standard de l'open source.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Branches & PR

## Exercice
1. Crée une branche `feat/contact` et ajoute-y une page de contact.
2. Commit, puis pousse la branche sur GitHub.
3. Ouvre une **pull request** vers `main` et rédige une description claire.
4. Fusionne la PR, puis supprime la branche.

## Bonus
Provoque volontairement un conflit (modifie la même ligne sur deux branches) et résous-le.
MD,
                    ],
                ],
            ],
            [
                'school' => 'mydigitalschool-vannes',
                'teacher' => 'prof@monto.test',
                'name' => 'APIs & introduction au backend',
                'description' => 'Comprendre l\'architecture REST, consommer une API depuis le front avec fetch et sécuriser les échanges par authentification.',
                'expected_hours' => 32,
                'classrooms' => ['b3-developpeur-web'],
                'chapters' => [
                    [
                        'title' => 'L\'architecture REST',
                        'video' => [
                            'title' => 'Tutoriel REST : comprendre REST',
                            'description' => 'Architecture client/serveur et verbes HTTP.',
                            'url' => 'https://www.youtube.com/watch?v=bqpXOT5mwW4',
                            'duration' => 1200,
                        ],
                        'markdown' => <<<'MD'
# L'architecture REST

## Client / serveur
Le **front** (navigateur, app mobile) demande des données ; le **backend**
(serveur + base de données) les fournit via une **API**. REST est le style
d'architecture le plus répandu pour ces échanges.

## Les verbes HTTP
| Verbe | Action | Exemple |
| --- | --- | --- |
| `GET` | Lire | `GET /api/articles` |
| `POST` | Créer | `POST /api/articles` |
| `PUT` / `PATCH` | Modifier | `PATCH /api/articles/12` |
| `DELETE` | Supprimer | `DELETE /api/articles/12` |

## Les ressources
Une API REST expose des **ressources** identifiées par des URLs :
```
/api/users            → la collection d'utilisateurs
/api/users/42         → l'utilisateur 42
/api/users/42/posts   → les posts de l'utilisateur 42
```

## Les codes de statut
- `200 OK`, `201 Created`
- `400 Bad Request`, `401 Unauthorized`, `404 Not Found`
- `500 Internal Server Error`

## Le format JSON
```json
{ "id": 42, "nom": "Léa", "role": "student" }
```

## À retenir
- Une ressource + un verbe = une action.
- Le code de statut indique **ce qui s'est passé**, le corps **contient les données**.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Concevoir une API REST

## Exercice
Pour un blog, écris sur papier les routes REST permettant de :
1. Lister tous les articles.
2. Lire un article précis.
3. Créer un article.
4. Modifier puis supprimer un article.

Indique pour chacune le **verbe HTTP**, l'**URL** et le **code de statut** attendu en cas de succès.
MD,
                    ],
                    [
                        'title' => 'Consommer une API avec fetch',
                        'video' => [
                            'title' => 'C\'est quoi une API REST ? S\'initier aux API avec Postman',
                            'description' => 'Tester et appeler une API.',
                            'url' => 'https://www.youtube.com/watch?v=pUbrKIdUhjo',
                            'duration' => 900,
                        ],
                        'pdf' => [
                            'title' => 'JavaScript Cheat Sheet',
                            'description' => 'Référence incluant fetch et l\'asynchrone.',
                            'url' => 'https://websitesetup.org/wp-content/uploads/2020/09/Javascript-Cheat-Sheet.pdf',
                        ],
                        'markdown' => <<<'MD'
# Consommer une API avec fetch

## L'API fetch
`fetch` permet d'appeler une API depuis le navigateur. Elle renvoie une
**promesse** (résultat à venir).
```js
fetch('https://api.exemple.com/articles')
  .then((reponse) => reponse.json())
  .then((articles) => console.log(articles))
  .catch((erreur) => console.error(erreur));
```

## La syntaxe async / await (plus lisible)
```js
async function chargerArticles() {
  try {
    const reponse = await fetch('/api/articles');
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
    const articles = await reponse.json();
    return articles;
  } catch (erreur) {
    console.error('Échec du chargement', erreur);
  }
}
```

## Envoyer des données (POST)
```js
await fetch('/api/articles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ titre: 'Mon article' }),
});
```

## À retenir
- `await` met en pause jusqu'à la réponse, sans bloquer la page.
- Toujours vérifier `reponse.ok` et gérer les erreurs avec `try/catch`.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — fetch

## Exercice
En utilisant l'API publique `https://jsonplaceholder.typicode.com/posts` :
1. Récupère les posts en `async/await` et affiche leurs titres.
2. Gère le cas d'erreur (`!reponse.ok`).
3. Envoie un nouveau post en `POST` et affiche la réponse.

## Question
Pourquoi `await fetch(...)` ne bloque-t-il pas l'interface ?
MD,
                    ],
                    [
                        'title' => 'Sécuriser une API : l\'authentification',
                        'video' => [
                            'title' => 'Tutoriel : Découverte du JWT',
                            'description' => 'Le principe des tokens d\'authentification.',
                            'url' => 'https://www.youtube.com/watch?v=S-xBAo47W58',
                            'duration' => 1080,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Découverte d\'API Platform : Authentification JSON',
                                'description' => 'Authentification proche de la stack du projet.',
                                'url' => 'https://www.youtube.com/watch?v=bewgb9buIfI',
                                'duration' => 900,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Sécuriser une API : l'authentification

## Le problème
Une API expose des données : il faut savoir **qui** appelle et **a-t-il le
droit**. On distingue :
- **Authentification** : prouver son identité (se connecter).
- **Autorisation** : a-t-on le droit d'accéder à cette ressource ?

## L'authentification par token
1. Le client envoie ses identifiants → `POST /api/auth/login`.
2. Le serveur renvoie un **token**.
3. Le client joint ce token à chaque requête :
```js
fetch('/api/me', {
  headers: { Authorization: 'Bearer ' + token },
});
```

## JWT vs token opaque
- **JWT** : jeton autoporteur, contient des infos signées (non chiffrées !).
- **Token opaque** (ex. Laravel Sanctum) : simple chaîne, vérifiée en base.

## Bonnes pratiques
- Toujours en **HTTPS** (le token transite en clair sinon).
- Ne jamais stocker de secret dans un JWT (il est lisible).
- Prévoir une **expiration** et une déconnexion (révocation).

## À retenir
- Authentification = qui ; autorisation = a-t-il le droit.
- `Authorization: Bearer <token>` est le standard.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Authentification

## Exercice
Sur l'API du projet (`http://localhost:8080/api`) :
1. Appelle `POST /api/auth/login` avec `eleve@monto.test` / `Eleve123!`.
2. Récupère le `token` de la réponse.
3. Appelle `GET /api/auth/me` en ajoutant l'en-tête `Authorization: Bearer <token>`.
4. Recommence **sans** le token : quel code de statut obtiens-tu ?

## Outil
Tu peux tout faire depuis Swagger : `http://localhost:8080/api/docs`.
MD,
                    ],
                ],
            ],
        ];
    }

    // ====================================================================
    //  DESIGN — MyDigitalSchool (M1 Design, partiellement B1 Cycle Web)
    // ====================================================================

    /** @return array<int, array<string, mixed>> */
    private function designCourses(): array
    {
        return [
            [
                'school' => 'mydigitalschool-vannes',
                'teacher' => 'prof@monto.test',
                'name' => 'Fondamentaux du design',
                'description' => 'Les principes visuels (Gestalt), la typographie, la couleur et la hiérarchie visuelle qui structurent toute interface réussie.',
                'expected_hours' => 30,
                'classrooms' => ['m1-design-ux-ui', 'b1-cycle-web'],
                'chapters' => [
                    [
                        'title' => 'La théorie de la Gestalt',
                        'video' => [
                            'title' => 'La théorie de la Gestalt (Adobe)',
                            'description' => 'Lois de fermeture, espaces négatifs, formes.',
                            'url' => 'https://www.youtube.com/watch?v=I2w7q5lUG7A',
                            'duration' => 900,
                        ],
                        'pdf' => [
                            'title' => 'Usability Guidelines for Accessible Web Design (NN/g)',
                            'description' => 'Recommandations fondées sur la recherche.',
                            'url' => 'https://media.nngroup.com/media/reports/free/Usability_Guidelines_for_Accessible_Web_Design.pdf',
                        ],
                        'markdown' => <<<'MD'
# La théorie de la Gestalt

## L'idée centrale
« Le tout est plus que la somme des parties. » Notre cerveau regroupe
automatiquement les éléments visuels. Les designers exploitent ces lois pour
guider l'œil et créer de l'ordre.

## Les principales lois
- **Proximité** : des éléments proches sont perçus comme un groupe.
- **Similarité** : des éléments semblables (couleur, forme) vont ensemble.
- **Continuité** : l'œil suit les lignes et les courbes.
- **Fermeture** : on complète mentalement les formes incomplètes.
- **Figure / fond** : on distingue un objet de son arrière-plan (espaces négatifs).

## Applications concrètes en UI
- Regrouper un label et son champ (proximité).
- Donner la même couleur aux liens (similarité).
- Aérer avec des **espaces négatifs** pour hiérarchiser.

## L'espace négatif
Le « vide » n'est pas perdu : il respire, sépare et met en valeur. Les
interfaces premium en utilisent beaucoup.

## À retenir
- La Gestalt explique **pourquoi** une mise en page « fonctionne ».
- Proximité et espace blanc sont vos meilleurs outils de hiérarchie.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — La Gestalt

## Exercice
Choisis une interface que tu utilises souvent (appli mobile, site).
1. Repère **3 lois de Gestalt** à l'œuvre (proximité, similarité, etc.).
2. Annote une capture d'écran pour les pointer.
3. Trouve **un** endroit où plus d'espace négatif améliorerait la lisibilité.
MD,
                    ],
                    [
                        'title' => 'Typographie & couleur',
                        'video' => [
                            'title' => 'Palette de couleurs : créer son design system de couleur',
                            'description' => 'Construire une palette cohérente.',
                            'url' => 'https://www.youtube.com/watch?v=teibAH4Mc_c',
                            'duration' => 840,
                        ],
                        'pdf' => [
                            'title' => 'The Designer\'s Guide to Professional Typography',
                            'description' => 'Guide complet de typographie professionnelle.',
                            'url' => 'https://www.mubranding.com/teach/wp-content/uploads/2020/06/the_designers_guide_to_professional_typo.pdf',
                        ],
                        'markdown' => <<<'MD'
# Typographie & couleur

## Typographie : les bases
- **Empattements (serif)** : classiques, éditoriaux (Times, Georgia).
- **Linéales (sans-serif)** : modernes, écran (Inter, Roboto).
- **Hiérarchie** : tailles, graisses et contrastes guident la lecture.
- **Interlignage** : ~1.4 à 1.6 pour un texte de paragraphe confortable.
- **Largeur de ligne** : 45–75 caractères pour rester lisible.

```
Titre        →  32 px / bold
Sous-titre   →  20 px / medium
Paragraphe   →  16 px / regular
```

## La couleur : un système, pas un hasard
- **Primaire** : couleur de marque, actions principales.
- **Secondaire / accent** : mise en avant ponctuelle.
- **Neutres** : gris pour textes, fonds, bordures.
- **Sémantiques** : succès (vert), erreur (rouge), alerte (orange).

## Construire une palette
On part d'une teinte et on génère des nuances (50 → 900). On vérifie toujours
le **contraste** texte/fond (ratio ≥ 4.5:1).

## À retenir
- Limiter le nombre de polices (1 à 2) et de couleurs vives.
- Une échelle typographique + une palette structurée = cohérence visuelle.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Typo & couleur

## Exercice
Sur [Coolors](https://coolors.co/) et [Google Fonts](https://fonts.google.com/) :
1. Compose une palette de 5 couleurs (1 primaire, 1 accent, 3 neutres).
2. Choisis 2 polices (une pour les titres, une pour le texte).
3. Définis une échelle typographique (titre / sous-titre / paragraphe).
4. Vérifie que ton texte sur fond passe le ratio de contraste **4.5:1**.
MD,
                    ],
                    [
                        'title' => 'Hiérarchie visuelle & mise en page',
                        'video' => [
                            'title' => 'Les grilles de composition : l\'outil indispensable des designers',
                            'description' => 'Grilles, composition et hiérarchie de l\'information.',
                            'url' => 'https://www.youtube.com/watch?v=WQNWjma-bGg',
                            'duration' => 720,
                        ],
                        'pdf' => [
                            'title' => 'Design Principles Cheat Sheet (Learning Loop)',
                            'description' => 'Aide-mémoire des principes de design.',
                            'url' => 'https://learningloop.io/uploads/resources/as21-design-principles-cheat-sheet.pdf',
                        ],
                        'markdown' => <<<'MD'
# Hiérarchie visuelle & mise en page

## La hiérarchie visuelle
C'est l'art de guider l'œil : montrer **quoi regarder en premier**. On la crée
avec :
- la **taille** (plus gros = plus important) ;
- le **contraste** et la **couleur** ;
- la **position** (haut/gauche lus en premier en occident) ;
- l'**espacement** (isoler = mettre en avant).

## La grille
La grille aligne et structure la page. La plus courante sur le web : **12
colonnes** avec des gouttières régulières.
```
| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
[      Image (6)      ][        Texte (6)         ]
```

## Les lois de proximité et d'alignement
- Aligner les éléments crée une impression d'ordre et de soin.
- Grouper par proximité réduit la charge mentale.

## Le rythme et l'espacement
Utiliser une **échelle d'espacement** cohérente (4, 8, 16, 24, 32 px…) donne un
rendu professionnel et harmonieux.

## À retenir
- Tout ne peut pas être « important » : choisis 1 point focal par écran.
- Grille + alignement + échelle d'espacement = mise en page propre.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Hiérarchie & grille

## Exercice
Redessine la page d'accueil d'un site de ton choix :
1. Pose une grille **12 colonnes**.
2. Définis **un seul** point focal (le plus gros / contrasté).
3. Aligne tous les éléments sur la grille.
4. Applique une échelle d'espacement (8 / 16 / 24 / 32 px).

## Critère
On doit identifier l'élément le plus important en moins de 3 secondes.
MD,
                    ],
                ],
            ],
            [
                'school' => 'mydigitalschool-vannes',
                'teacher' => 'prof@monto.test',
                'name' => 'Figma & prototypage',
                'description' => 'Maîtriser Figma : prise en main, composants et design system, jusqu\'au prototype interactif.',
                'expected_hours' => 36,
                'classrooms' => ['m1-design-ux-ui', 'b1-cycle-web'],
                'chapters' => [
                    [
                        'title' => 'Prise en main de Figma',
                        'video' => [
                            'title' => 'Figma pour débutants — Les bases pour bien débuter',
                            'description' => 'Découverte de l\'interface Figma.',
                            'url' => 'https://www.youtube.com/watch?v=oBcbcmYfSLk',
                            'duration' => 1080,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Les bases de Figma : tout savoir pour bien commencer',
                                'description' => 'Cours gratuit débutant en français.',
                                'url' => 'https://www.youtube.com/watch?v=lgPtcrMp828',
                                'duration' => 1500,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Prise en main de Figma

## Pourquoi Figma ?
Outil de design d'interface **collaboratif** et **dans le navigateur** : design,
prototypage et partage au même endroit. Devenu le standard du métier.

## L'interface
- **Canvas** : l'espace de travail infini.
- **Frames** : des cadres = des écrans (ex. iPhone 14, Desktop 1440).
- **Calques (layers)** : la hiérarchie des éléments, à gauche.
- **Propriétés** : taille, couleur, effets, à droite.

## Outils essentiels
- `F` : créer une frame · `R` : rectangle · `T` : texte.
- **Auto Layout** (`Shift+A`) : des conteneurs qui s'adaptent au contenu
  (équivalent de Flexbox pour le design).
- **Styles** : enregistrer couleurs et typographies réutilisables.

## Bonnes pratiques dès le départ
- Nommer ses calques et ses frames.
- Travailler en **Auto Layout** plutôt qu'en positionnement libre.
- Utiliser une grille / des colonnes pour aligner.

## À retenir
- Une frame = un écran ; les calques structurent le design.
- Auto Layout est la compétence Figma la plus rentable à acquérir.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Prise en main de Figma

## Exercice
Crée ton premier écran mobile :
1. Une frame **iPhone**.
2. Une carte produit en **Auto Layout** (image + titre + prix + bouton).
3. Enregistre une couleur et une typo en **styles** réutilisables.
4. Duplique la carte 3 fois : elles doivent rester cohérentes.
MD,
                    ],
                    [
                        'title' => 'Composants & design system',
                        'video' => [
                            'title' => 'Créer et utiliser les composants et variants dans Figma',
                            'description' => 'Composants réutilisables et variantes.',
                            'url' => 'https://www.youtube.com/watch?v=6VovBFgGiIs',
                            'duration' => 1020,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Figma tutoriel : les composants',
                                'description' => 'Créer, organiser, instancier des composants.',
                                'url' => 'https://www.youtube.com/watch?v=FzflOBDjwmM',
                                'duration' => 1140,
                            ],
                        ],
                        'pdf' => [
                            'title' => 'Atomic Design (Brad Frost)',
                            'description' => 'La référence sur les design systems.',
                            'url' => 'https://www.softouch.on.ca/kb/data/Atomic%20Design.pdf',
                        ],
                        'markdown' => <<<'MD'
# Composants & design system

## Le composant
Un **composant** est un élément réutilisable (bouton, carte, champ). On modifie
le composant maître → toutes ses **instances** se mettent à jour.

## Les variants
Un même composant avec plusieurs états regroupés : `Bouton` avec les variantes
`défaut / survol / désactivé`, `primaire / secondaire`.

## Atomic Design (Brad Frost)
Une méthode pour construire un système d'interface par niveaux :
```
Atomes      → bouton, input, label
Molécules   → champ de recherche (input + bouton)
Organismes  → barre de navigation complète
Templates   → structure d'une page
Pages       → page avec contenu réel
```

## Le design system
C'est l'ensemble cohérent : **tokens** (couleurs, espacements, typo) +
**composants** + **règles d'usage**. Il garantit la cohérence et accélère le
travail entre designers et développeurs.

## À retenir
- Composants + variants = ne plus jamais redessiner deux fois.
- Penser « du plus petit au plus grand » (atomes → pages).
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Composants

## Exercice
1. Transforme ton bouton en **composant**.
2. Crée 3 **variants** : primaire, secondaire, désactivé.
3. Crée une **molécule** « champ de recherche » (input + bouton).
4. Modifie le composant maître et vérifie que toutes les instances suivent.
MD,
                    ],
                    [
                        'title' => 'Prototypage interactif',
                        'video' => [
                            'title' => 'Figma pour débutants — les prototypes',
                            'description' => 'Rendre une maquette cliquable.',
                            'url' => 'https://www.youtube.com/watch?v=M0xkv7Sqtc0',
                            'duration' => 960,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Le prototype sur Figma : tutoriel pour bien comprendre',
                                'description' => 'Transitions et interactions.',
                                'url' => 'https://www.youtube.com/watch?v=tYKkzsAoIG8',
                                'duration' => 900,
                            ],
                        ],
                        'pdf' => [
                            'title' => 'Demo Test Script (Steve Krug)',
                            'description' => 'Script de test d\'utilisabilité.',
                            'url' => 'https://sensible.com/downloads/demo-test-script.pdf',
                        ],
                        'markdown' => <<<'MD'
# Prototypage interactif

## Du statique à l'interactif
Le **prototype** relie les écrans entre eux pour simuler le parcours réel, sans
écrire une ligne de code. Indispensable pour tester avant de développer.

## Créer un flux dans Figma
1. Onglet **Prototype** (à droite).
2. Tirer un lien depuis un bouton vers l'écran cible.
3. Choisir le **déclencheur** (`On click`, `On hover`…).
4. Choisir l'**animation** (`Instant`, `Dissolve`, `Smart Animate`).

## Smart Animate
Anime automatiquement les éléments partagés entre deux frames (déplacement,
taille). Très puissant pour des micro-interactions crédibles.

## Tester son prototype
- Lancer en mode présentation (`▶`).
- Partager le lien aux testeurs.
- Observer **sans guider** : on note les hésitations et les blocages.

## À retenir
- Un prototype sert à **valider un parcours** avant de coder.
- Tester tôt, même un prototype imparfait, fait gagner beaucoup de temps.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Prototypage

## Exercice
À partir de 3 écrans (accueil → liste → détail) :
1. Relie-les avec des interactions `On click`.
2. Ajoute une transition `Smart Animate` entre deux écrans.
3. Lance le mode présentation et teste le parcours.
4. Partage le lien à un camarade et observe-le **sans l'aider**.
MD,
                    ],
                ],
            ],
            [
                'school' => 'mydigitalschool-vannes',
                'teacher' => 'prof@monto.test',
                'name' => 'UX Research',
                'description' => 'Comprendre les utilisateurs : méthodes de recherche, personas, parcours utilisateur et tests d\'utilisabilité.',
                'expected_hours' => 26,
                'classrooms' => ['m1-design-ux-ui'],
                'chapters' => [
                    [
                        'title' => 'Méthodes de recherche utilisateur',
                        'video' => [
                            'title' => 'Recherche utilisateur facile : la méthode Guerilla',
                            'description' => 'Tester vite et à moindre coût.',
                            'url' => 'https://www.youtube.com/watch?v=ocAYoYwi5u8',
                            'duration' => 1500,
                        ],
                        'pdf' => [
                            'title' => 'User-Experience Research Methods (NN/g)',
                            'description' => 'Panorama des méthodes UX.',
                            'url' => 'https://media.nngroup.com/media/articles/attachments/User_Research_Methods_A4-compressed.pdf',
                        ],
                        'markdown' => <<<'MD'
# Méthodes de recherche utilisateur

## Pourquoi faire de la recherche ?
Pour concevoir **pour de vrais besoins**, pas pour ses suppositions. La
recherche réduit le risque de développer la mauvaise chose.

## Deux grandes familles
- **Qualitatif** (pourquoi ?) : entretiens, tests d'utilisabilité, observation.
- **Quantitatif** (combien ?) : sondages, analytics, A/B tests.

## Quelques méthodes
| Méthode | Quand | Apporte |
| --- | --- | --- |
| Entretien | En amont | Comprendre besoins et frustrations |
| Test d'utilisabilité | Sur maquette/produit | Détecter les blocages |
| Sondage | À grande échelle | Tendances chiffrées |
| Tri de cartes | Architecture d'info | Organiser les contenus |

## La méthode « Guerilla »
Tester rapidement, sur le terrain, avec peu de moyens (5 utilisateurs suffisent
souvent à révéler la majorité des problèmes).

## À retenir
- Qualitatif pour le « pourquoi », quantitatif pour le « combien ».
- 5 utilisateurs révèlent déjà ~85 % des problèmes d'utilisabilité.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Recherche utilisateur

## Exercice
Pour un projet d'appli (ex. réservation de salle de sport) :
1. Rédige un **guide d'entretien** de 5 questions ouvertes.
2. Interroge 2 personnes de la cible.
3. Note les 3 besoins et 2 frustrations qui reviennent.

## Règle d'or
Pas de questions fermées ni orientées (« Aimeriez-vous… ? » → biaisé).
MD,
                    ],
                    [
                        'title' => 'Personas & parcours utilisateur',
                        'video' => [
                            'title' => 'UX Design : Persona & User Journey Map (exemple concret)',
                            'description' => 'Construire un persona et son parcours.',
                            'url' => 'https://www.youtube.com/watch?v=R5Dfk4o6Anc',
                            'duration' => 1080,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Comment créer des wireframes pour une application mobile',
                                'description' => 'Du parcours au wireframe.',
                                'url' => 'https://www.youtube.com/watch?v=zIooD7F5NKA',
                                'duration' => 1140,
                            ],
                        ],
                        'pdf' => [
                            'title' => 'The Basics of UX Design (IxDF)',
                            'description' => 'Introduction aux fondamentaux de l\'UX.',
                            'url' => 'https://bpb-eu-w2.wpmucdn.com/sites.aub.edu.lb/dist/c/13/files/2019/06/the-basics-of-ux-design.pdf',
                        ],
                        'markdown' => <<<'MD'
# Personas & parcours utilisateur

## Le persona
Un **persona** est un profil type qui synthétise la recherche : un visage, un
objectif, un contexte, des freins. Il garde l'équipe alignée sur l'utilisateur
réel plutôt que sur soi-même.
```
Léa, 22 ans, étudiante
Objectif : réviser efficacement entre deux cours
Frein : peu de temps, beaucoup de supports éparpillés
```

## Le parcours utilisateur (user journey)
On cartographie les **étapes** vécues par le persona pour atteindre son objectif,
avec à chaque étape : action, émotion, point de douleur, opportunité.
```
Découvre → S'inscrit → Cherche un cours → Suit le cours → Révise
  😐          😕            🙂                😀            😐
```

## Les wireframes
Maquettes **basse fidélité** (sans couleur ni style) qui posent la structure et
le parcours avant de soigner le visuel. On itère vite, sans s'attacher.

## À retenir
- Le persona incarne la cible ; le parcours révèle les moments à améliorer.
- Wireframe d'abord, esthétique ensuite.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Persona & parcours

## Exercice
À partir de tes entretiens du chapitre précédent :
1. Rédige **1 persona** (nom, âge, objectif, frein principal).
2. Dessine son **parcours** en 5 étapes avec l'émotion associée à chacune.
3. Identifie le **point de douleur** majeur et propose une amélioration.
MD,
                    ],
                    [
                        'title' => 'Conduire un test d\'utilisabilité',
                        'video' => [
                            'title' => 'Recherche utilisateur facile : la méthode Guerilla',
                            'description' => 'Observer un utilisateur en situation.',
                            'url' => 'https://www.youtube.com/watch?v=ocAYoYwi5u8',
                            'duration' => 1500,
                        ],
                        'pdf' => [
                            'title' => 'Instructions for Observers (Steve Krug)',
                            'description' => 'Guide pour les observateurs d\'un test.',
                            'url' => 'https://sensible.com/downloads/instructions-for-observers.pdf',
                        ],
                        'markdown' => <<<'MD'
# Conduire un test d'utilisabilité

## Le principe
On demande à un utilisateur de réaliser des **tâches** réelles pendant qu'on
**observe** sans l'aider. On apprend en regardant où il bute.

## Préparer le test
1. Définir 3 à 5 **tâches** concrètes (« Trouve et achète un billet »).
2. Recruter des participants proches de la cible.
3. Préparer un **script** neutre (mêmes consignes pour tous).

## Pendant le test
- Faire **penser à voix haute** le participant.
- Ne **pas** souffler la réponse.
- Noter : hésitations, erreurs, commentaires, émotions.

## Analyser
- Regrouper les problèmes récurrents.
- Distinguer « gêne mineure » et « blocage critique ».
- Transformer en actions concrètes pour la prochaine itération.

## À retenir
- On teste des **tâches**, pas des opinions.
- L'observateur se tait : ce sont les silences et les hésitations qui informent.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Test d'utilisabilité

## Exercice
Sur ton prototype Figma :
1. Rédige **3 tâches** à faire réaliser (formulées comme des objectifs).
2. Fais tester par 3 personnes en mode « pense à voix haute ».
3. Note chaque hésitation/blocage.
4. Classe les problèmes par gravité et liste les 2 corrections prioritaires.
MD,
                    ],
                ],
            ],
        ];
    }

    // ====================================================================
    //  DÉCOUVERTE — B1 Cycle Web (initiation marketing, école MyDigital)
    // ====================================================================

    /** @return array<int, array<string, mixed>> */
    private function discoveryCourses(): array
    {
        return [
            [
                'school' => 'mydigitalschool-vannes',
                'teacher' => 'prof@monto.test',
                'name' => 'Découverte du webmarketing',
                'description' => 'Initiation au marketing digital pour les profils web : panorama des leviers, bases du référencement et présence sur les réseaux sociaux.',
                'expected_hours' => 18,
                'classrooms' => ['b1-cycle-web'],
                'chapters' => [
                    [
                        'title' => 'C\'est quoi le marketing digital ?',
                        'video' => [
                            'title' => 'Les fondamentaux du marketing digital',
                            'description' => 'Panorama des leviers du marketing en ligne.',
                            'url' => 'https://www.youtube.com/watch?v=OJcssxqjtxI',
                            'duration' => 900,
                        ],
                        'pdf' => [
                            'title' => 'Introduction au marketing digital (Pearson)',
                            'description' => 'Chapitre 1 de référence (Chaffey & al.).',
                            'url' => 'https://www.pearson.fr/resources/titles/27440100284350/extras/F0254_Chap1.pdf',
                        ],
                        'markdown' => <<<'MD'
# C'est quoi le marketing digital ?

## Définition
Le marketing digital regroupe **tous les leviers en ligne** pour attirer,
convertir et fidéliser des clients : site, SEO, réseaux sociaux, publicité,
e-mail, etc.

## Les grands leviers
- **SEO** : être visible gratuitement dans Google.
- **SEA** : publicité payante (Google Ads, Meta Ads).
- **Réseaux sociaux** : présence et communauté.
- **Content marketing** : créer du contenu utile.
- **Emailing / CRM** : relation directe et fidélisation.
- **Analytics** : mesurer pour décider.

## Le tunnel de conversion (entonnoir)
```
Attirer  →  Convertir  →  Fidéliser
(trafic)    (lead/achat)   (réachat, bouche-à-oreille)
```

## Inbound vs Outbound
- **Outbound** : on va vers le client (pub, démarchage).
- **Inbound** : on attire le client avec du contenu de valeur.

## Pourquoi c'est utile à un dev / designer ?
Comprendre le marketing aide à construire des produits **trouvables**,
**mesurables** et orientés utilisateur.

## À retenir
- Le digital = plusieurs leviers complémentaires, pas un seul.
- Tout se mesure : c'est la grande force du marketing en ligne.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Panorama des leviers

## Exercice
Pour une petite entreprise locale (ex. un food-truck) :
1. Cite **3 leviers** digitaux pertinents et explique pourquoi.
2. Place chacun dans le tunnel : attirer / convertir / fidéliser.
3. Donne **1 action concrète** par levier choisi.
MD,
                    ],
                    [
                        'title' => 'Les bases du SEO',
                        'video' => [
                            'title' => 'SEO : les bases du référencement naturel',
                            'description' => 'Comprendre le référencement pour débutants.',
                            'url' => 'https://www.youtube.com/watch?v=UxIRq_bWE6I',
                            'duration' => 960,
                        ],
                        'pdf' => [
                            'title' => 'Search Engine Optimization Starter Guide (Google)',
                            'description' => 'Guide SEO officiel de Google.',
                            'url' => 'https://www.cuit.columbia.edu/sites/default/files/content/search-engine-optimization-starter-guide.pdf',
                        ],
                        'markdown' => <<<'MD'
# Les bases du SEO

## Le SEO, c'est quoi ?
**Search Engine Optimization** = optimiser un site pour apparaître haut dans les
résultats **naturels** (non payants) de Google.

## Les 3 piliers
1. **Technique** : site rapide, mobile, bien structuré, indexable.
2. **Contenu** : répondre réellement à l'intention de recherche.
3. **Popularité** : liens entrants (*backlinks*) de qualité.

## Les balises qui comptent
```html
<title>Cours de guitare à Vannes — École XYZ</title>
<meta name="description" content="Apprenez la guitare à Vannes…" />
<h1>Cours de guitare pour débutants</h1>
```
Un seul `<title>` et `<h1>` clairs, contenant le mot-clé principal.

## Mesurer
- **Google Search Console** : positions, clics, impressions.
- Suivre l'évolution du trafic organique dans le temps.

## À retenir
- Bon contenu + bonne technique + popularité = bon référencement.
- Le SEO est un travail de fond : les résultats arrivent sur la durée.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — SEO de base

## Exercice
Sur une page web de ton choix :
1. Rédige un `<title>` et une `<meta description>` optimisés (avec le mot-clé).
2. Vérifie qu'il y a **un seul** `<h1>`.
3. Liste 3 améliorations techniques possibles (vitesse, mobile, structure).
MD,
                    ],
                    [
                        'title' => 'Les réseaux sociaux pour une entreprise',
                        'video' => [
                            'title' => 'Quels réseaux sociaux pour ma stratégie marketing ?',
                            'description' => 'Choisir ses réseaux selon sa cible.',
                            'url' => 'https://www.youtube.com/watch?v=Vf1tK9TKDJE',
                            'duration' => 780,
                        ],
                        'markdown' => <<<'MD'
# Les réseaux sociaux pour une entreprise

## Pourquoi être présent ?
Les réseaux sociaux servent à gagner en **notoriété**, créer une **communauté**
et générer du trafic vers son site. Mais on ne va pas partout : on choisit.

## Choisir selon sa cible
| Réseau | Cible / usage |
| --- | --- |
| Instagram | Visuel, lifestyle, jeunes adultes |
| TikTok | Vidéo courte, audience jeune |
| LinkedIn | B2B, professionnels |
| Facebook | Communautés locales, large audience |

## Les bases d'une présence réussie
- Une **ligne éditoriale** claire (de quoi je parle, sur quel ton).
- De la **régularité** (mieux vaut 2 posts/semaine tenus que 10 puis rien).
- De l'**engagement** : répondre, animer, poser des questions.

## Mesurer
Portée, engagement (likes, commentaires, partages), croissance des abonnés,
clics vers le site.

## À retenir
- Être là où est sa cible, pas partout.
- Régularité + engagement priment sur le nombre brut d'abonnés.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Présence sociale

## Exercice
Pour une marque fictive :
1. Choisis **2 réseaux** adaptés à sa cible et justifie.
2. Définis une mini **ligne éditoriale** (thèmes, ton, fréquence).
3. Rédige **3 idées de posts** pour la première semaine.
MD,
                    ],
                ],
            ],
        ];
    }

    // ====================================================================
    //  MARKETING — AFTEC (B3 Marketing Digital)
    // ====================================================================

    /** @return array<int, array<string, mixed>> */
    private function marketingCourses(): array
    {
        return [
            [
                'school' => 'aftec-vannes',
                'teacher' => 'prof.market@monto.test',
                'name' => 'Fondamentaux du marketing digital',
                'description' => 'Le socle du marketing en ligne : leviers, ciblage par personas et stratégie pilotée par le tunnel de conversion.',
                'expected_hours' => 30,
                'classrooms' => ['b3-marketing-digital'],
                'chapters' => [
                    [
                        'title' => 'Panorama du marketing digital',
                        'video' => [
                            'title' => 'Les fondamentaux du marketing digital',
                            'description' => 'Tour d\'horizon des leviers.',
                            'url' => 'https://www.youtube.com/watch?v=OJcssxqjtxI',
                            'duration' => 900,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Le marketing en 50 minutes (tutoriel ultime)',
                                'description' => 'Synthèse complète du marketing.',
                                'url' => 'https://www.youtube.com/watch?v=cCRK3g9KpUc',
                                'duration' => 3000,
                            ],
                        ],
                        'pdf' => [
                            'title' => 'Introduction au marketing digital (Pearson)',
                            'description' => 'Chapitre 1 (Chaffey & al.).',
                            'url' => 'https://www.pearson.fr/resources/titles/27440100284350/extras/F0254_Chap1.pdf',
                        ],
                        'markdown' => <<<'MD'
# Panorama du marketing digital

## Du marketing au marketing digital
Le marketing répond à un besoin par une offre. Le **digital** ajoute des canaux
en ligne, une mesure précise et une relation directe avec l'audience.

## Le mix des leviers
- **Acquisition** : SEO, SEA, social ads, partenariats.
- **Engagement** : réseaux sociaux, contenu, communauté.
- **Conversion** : site, landing pages, e-commerce.
- **Fidélisation** : emailing, CRM, programmes de fidélité.

## Le tunnel (funnel)
```
TOFU  (notoriété)    → contenu, awareness
MOFU  (considération) → comparatifs, lead magnets
BOFU  (décision)     → offres, démos, achat
```

## Objectifs SMART & KPIs
Un objectif est **S**pécifique, **M**esurable, **A**tteignable, **R**éaliste,
**T**emporel. On le suit avec des **KPIs** (trafic, taux de conversion, CAC, ROI).

## À retenir
- Le digital se pilote par la donnée et le funnel.
- Stratégie d'abord, tactique ensuite.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Mix de leviers

## Exercice
Pour une marque de cosmétiques bio :
1. Sélectionne **4 leviers** et range-les dans le funnel (TOFU/MOFU/BOFU).
2. Fixe **1 objectif SMART** par étape du funnel.
3. Associe **1 KPI** à chaque objectif.
MD,
                    ],
                    [
                        'title' => 'Cibles & personas',
                        'video' => [
                            'title' => 'Définir votre cible client avec la méthode Persona',
                            'description' => 'Construire un persona marketing.',
                            'url' => 'https://www.youtube.com/watch?v=nk-tUrDLq9M',
                            'duration' => 360,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Comment définir votre clientèle cible ?',
                                'description' => 'Identifier sa cible.',
                                'url' => 'https://www.youtube.com/watch?v=SXDDTvr70Kw',
                                'duration' => 600,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Cibles & personas

## Pourquoi cibler ?
« Parler à tout le monde, c'est ne parler à personne. » Définir une cible permet
des messages, des canaux et des offres **pertinents**.

## Segmentation
On découpe le marché selon des critères :
- **Démographiques** : âge, sexe, CSP, localisation.
- **Comportementaux** : habitudes d'achat, usage.
- **Psychographiques** : valeurs, centres d'intérêt.

## Le persona marketing
Un portrait-robot du client idéal :
```
Sophie, 34 ans, cadre urbaine
Objectifs : manger sain malgré un agenda chargé
Freins : manque de temps, méfiance sur les labels
Canaux : Instagram, newsletters, podcasts
```

## Le parcours d'achat
Le persona traverse des étapes : prise de conscience → considération →
décision → fidélité. On adapte le message à chaque étape.

## À retenir
- Segmenter puis incarner la cible dans un **persona**.
- Le bon message, au bon moment, sur le bon canal.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Persona marketing

## Exercice
Pour la marque de cosmétiques bio du chapitre 1 :
1. Définis **2 segments** de clientèle.
2. Rédige **1 persona détaillé** (nom, profil, objectifs, freins, canaux).
3. Propose **1 message clé** adapté à ce persona.
MD,
                    ],
                    [
                        'title' => 'Stratégie & tunnel de conversion',
                        'video' => [
                            'title' => 'Funnel marketing (entonnoir de conversion) : définition et exemples',
                            'description' => 'Construire et piloter un funnel.',
                            'url' => 'https://www.youtube.com/watch?v=AFmfjhKaV4Y',
                            'duration' => 420,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Funnel de vente : comment ça marche ?',
                                'description' => 'Le tunnel de vente expliqué.',
                                'url' => 'https://www.youtube.com/watch?v=E6DK8z6MkcY',
                                'duration' => 600,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Stratégie & tunnel de conversion

## Le tunnel de conversion
Le **funnel** modélise le parcours d'un inconnu jusqu'au client fidèle. À chaque
étape, une partie de l'audience « tombe » : on cherche à réduire ces pertes.
```
Visiteurs → Prospects → Leads → Clients → Ambassadeurs
   100         40         15        5          1
```

## AARRR (les « pirate metrics »)
**A**cquisition · **A**ctivation · **R**étention · **R**evenu · **R**ecommandation.
Un cadre simple pour repérer où le funnel fuit.

## Les taux de conversion
Taux = passage d'une étape à la suivante. On optimise l'étape la plus faible en
premier (effet de levier maximal).

## Objectifs SMART
On traduit la stratégie en objectifs mesurables et datés, puis en actions par
levier (SEO pour l'acquisition, emailing pour la rétention…).

## À retenir
- Le funnel révèle **où** agir en priorité.
- On optimise l'étape qui fuit le plus, pas celle qui est déjà bonne.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Funnel

## Exercice
On te donne : 10 000 visiteurs → 800 inscrits → 120 acheteurs.
1. Calcule les **taux de conversion** de chaque étape.
2. Identifie l'étape la plus faible.
3. Propose **2 actions** concrètes pour l'améliorer.
MD,
                    ],
                ],
            ],
            [
                'school' => 'aftec-vannes',
                'teacher' => 'prof.market@monto.test',
                'name' => 'SEO & référencement naturel',
                'description' => 'Maîtriser les piliers du SEO : compréhension des moteurs, recherche de mots-clés et optimisation on-page pour une visibilité durable.',
                'expected_hours' => 30,
                'classrooms' => ['b3-marketing-digital'],
                'chapters' => [
                    [
                        'title' => 'Comprendre le référencement naturel',
                        'video' => [
                            'title' => 'Formation SEO — Référencement naturel de son site web',
                            'description' => 'Tuto SEO débutant FR.',
                            'url' => 'https://www.youtube.com/watch?v=XdT9Gys_Ou4',
                            'duration' => 1200,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'SEO : les bases du référencement naturel',
                                'description' => 'Les fondamentaux pour débutants.',
                                'url' => 'https://www.youtube.com/watch?v=UxIRq_bWE6I',
                                'duration' => 960,
                            ],
                        ],
                        'pdf' => [
                            'title' => 'Search Engine Optimization Starter Guide (Google)',
                            'description' => 'Guide SEO officiel de Google.',
                            'url' => 'https://www.cuit.columbia.edu/sites/default/files/content/search-engine-optimization-starter-guide.pdf',
                        ],
                        'markdown' => <<<'MD'
# Comprendre le référencement naturel

## Comment fonctionne un moteur
1. **Crawl** : les robots explorent le web.
2. **Index** : ils stockent les pages.
3. **Ranking** : ils classent selon des centaines de critères.

## Les 3 piliers du SEO
- **Technique** : vitesse, mobile, structure, `robots.txt`, sitemap.
- **On-page** : titres, contenu, balises, maillage interne.
- **Off-page** : backlinks, notoriété de la marque.

## L'intention de recherche
Pour chaque requête, Google cherche à satisfaire une **intention** :
informationnelle (« comment… »), commerciale, transactionnelle (« acheter… »).

## Mesurer & suivre
- **Search Console** (clics, positions, indexation).
- Suivi de positions sur les mots-clés cibles.

## À retenir
- Crawl → Index → Ranking : il faut être explorable **et** pertinent.
- Le SEO combine technique, contenu et popularité, sur la durée.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Diagnostic SEO

## Exercice
Choisis un site et analyse-le :
1. Est-il **mobile-friendly** et rapide (teste avec PageSpeed Insights) ?
2. Les `<title>` et `<h1>` sont-ils uniques et pertinents ?
3. Trouve 1 page et devine son **intention de recherche** cible.
MD,
                    ],
                    [
                        'title' => 'Recherche de mots-clés',
                        'video' => [
                            'title' => 'Recherche de mots-clés SEO : 15 minutes pour tout comprendre',
                            'description' => 'Méthode de keyword research.',
                            'url' => 'https://www.youtube.com/watch?v=h8MXw6fL9GY',
                            'duration' => 900,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Comment choisir ses mots-clés SEO ? Stratégie + outils',
                                'description' => 'Stratégie complète de mots-clés.',
                                'url' => 'https://www.youtube.com/watch?v=PhyBrRa2Z2k',
                                'duration' => 780,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Recherche de mots-clés

## Le point de départ du SEO
On ne devine pas : on cible des requêtes **réellement tapées** par la cible. La
recherche de mots-clés guide tout le contenu.

## Les critères d'un bon mot-clé
- **Volume** : nombre de recherches mensuelles.
- **Concurrence** : difficulté à se positionner.
- **Intention** : correspond-il à ce qu'on propose ?
- **Pertinence** : est-il aligné avec l'activité ?

## La longue traîne
Les requêtes longues et précises (« chaussures running femme pieds larges »)
ont moins de volume mais **convertissent mieux** et sont moins concurrentielles.

## Les outils
Google Suggest, Search Console, Ubersuggest, Answer The Public, Google Keyword
Planner.

## À retenir
- Volume × concurrence × intention = priorisation des mots-clés.
- La longue traîne est l'amie des sites jeunes.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Mots-clés

## Exercice
Pour une boutique de thé en ligne :
1. Trouve **10 mots-clés** (mélange courte et longue traîne).
2. Pour chacun, estime l'intention (info / commerciale / transactionnelle).
3. Sélectionne les **3 prioritaires** et justifie (volume vs concurrence).

## Outil
Utilise Google Suggest (autocomplétion) et Answer The Public.
MD,
                    ],
                    [
                        'title' => 'Optimisation on-page',
                        'video' => [
                            'title' => 'Comment optimiser la balise Title en SEO ?',
                            'description' => 'Optimisation on-page pas à pas.',
                            'url' => 'https://www.youtube.com/watch?v=C3hxknoyzrk',
                            'duration' => 720,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Le netlinking SEO c\'est quoi ? À quoi servent les backlinks ?',
                                'description' => 'Introduction au off-page / netlinking.',
                                'url' => 'https://www.youtube.com/watch?v=bE_FKxD3-2o',
                                'duration' => 600,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Optimisation on-page

## Les balises clés
```html
<title>Mot-clé principal — Marque (≤ 60 caractères)</title>
<meta name="description" content="Résumé incitatif ≤ 155 caractères" />
<h1>Titre unique contenant le mot-clé</h1>
```
Le `<title>` est l'un des facteurs on-page les plus importants : unique, clair,
avec le mot-clé en début.

## La structure du contenu
- Un seul `<h1>`, des `<h2>`/`<h3>` logiques.
- Texte qui **répond à l'intention**, pas du bourrage de mots-clés.
- **Maillage interne** : lier ses pages entre elles.
- Images optimisées (`alt`, poids réduit).

## Off-page : le netlinking
Les **backlinks** (liens d'autres sites vers le vôtre) sont un vote de
confiance. Mieux vaut quelques liens de qualité que beaucoup de mauvais.

## À retenir
- `<title>` + contenu pertinent + maillage interne = base on-page solide.
- Le netlinking de qualité renforce l'autorité du site.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — On-page

## Exercice
Pour 1 mot-clé prioritaire choisi au chapitre précédent :
1. Rédige le `<title>` (≤ 60 car.) et la `<meta description>` (≤ 155 car.).
2. Propose un plan de page (`h1`, `h2`, `h3`).
3. Liste 3 pages internes vers lesquelles créer un lien (maillage).
MD,
                    ],
                ],
            ],
            [
                'school' => 'aftec-vannes',
                'teacher' => 'prof.market@monto.test',
                'name' => 'Content marketing & stratégie éditoriale',
                'description' => 'Créer du contenu utile qui attire et convertit : stratégie, ligne éditoriale, calendrier et copywriting.',
                'expected_hours' => 26,
                'classrooms' => ['b3-marketing-digital'],
                'chapters' => [
                    [
                        'title' => 'Stratégie de contenu',
                        'video' => [
                            'title' => 'Content marketing : générer des leads avec le contenu',
                            'description' => 'Utiliser le marketing de contenu.',
                            'url' => 'https://www.youtube.com/watch?v=73vLFU6g_YE',
                            'duration' => 1080,
                        ],
                        'pdf' => [
                            'title' => 'Marketing de contenu réussi (LinkedIn)',
                            'description' => 'Guide pratique du content marketing.',
                            'url' => 'https://business.linkedin.com/content/dam/business/marketing-solutions/regional/fr-fr/campaigns/pdfs/smg-content-marketing-ebook-french-corp-emea.pdf',
                        ],
                        'markdown' => <<<'MD'
# Stratégie de contenu

## L'idée
Plutôt que d'interrompre (pub), on **attire** en publiant du contenu qui répond
aux questions de la cible. C'est le cœur de l'**inbound marketing**.

## Les formats
- Articles de blog (SEO), guides, livres blancs.
- Vidéos, podcasts, infographies.
- Newsletters, posts réseaux sociaux.

## Le funnel de contenu
```
TOFU : « Qu'est-ce que… »   → attirer
MOFU : « Comment choisir… » → considérer
BOFU : « Démo / cas client » → convertir
```

## Mesurer
Trafic, temps de lecture, partages, leads générés, conversions assistées.

## À retenir
- Contenu utile + régularité + ligne éditoriale claire.
- Adapter le contenu à l'étape du parcours d'achat.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Idées de contenu

## Exercice
Pour la boutique de thé :
1. Propose **1 contenu par étape** du funnel (TOFU / MOFU / BOFU).
2. Indique le **format** le plus adapté pour chacun.
3. Pour le contenu TOFU, trouve un titre optimisé SEO.
MD,
                    ],
                    [
                        'title' => 'Ligne éditoriale & calendrier',
                        'video' => [
                            'title' => 'Comment créer son calendrier éditorial de zéro',
                            'description' => 'Astuces, conseils et modèle.',
                            'url' => 'https://www.youtube.com/watch?v=3BKvv-2U4P8',
                            'duration' => 900,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Comment créer un planning éditorial ?',
                                'description' => 'Organiser ses publications.',
                                'url' => 'https://www.youtube.com/watch?v=-buemnXOZHQ',
                                'duration' => 660,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Ligne éditoriale & calendrier

## La ligne éditoriale
Elle fixe le cadre de tout le contenu :
- **À qui** on parle (persona).
- **De quoi** (thématiques, piliers de contenu).
- **Comment** (ton de voix : expert, complice, décalé…).
- **Où** (canaux) et **à quelle fréquence**.

## Les piliers de contenu
3 à 5 grands thèmes récurrents qui structurent les publications et évitent la
panne d'idées.

## Le calendrier éditorial
Un tableau qui planifie : date, canal, format, sujet, mot-clé, statut. Il garantit
la **régularité**, plus importante que le volume.

## Le recyclage (repurposing)
Un article → plusieurs posts → une vidéo → une infographie. On démultiplie un
même contenu sur plusieurs canaux.

## À retenir
- Ligne éditoriale = la boussole ; calendrier = le moteur de la régularité.
- Un bon contenu se recycle sur plusieurs formats.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Calendrier éditorial

## Exercice
1. Définis **3 piliers de contenu** pour la boutique de thé.
2. Construis un **calendrier sur 2 semaines** (date, canal, format, sujet).
3. Choisis 1 article et décline-le en **3 posts** réseaux sociaux (recyclage).
MD,
                    ],
                    [
                        'title' => 'Copywriting & rédaction web',
                        'video' => [
                            'title' => 'Stratégie Copywriting : vendre avec les mots',
                            'description' => 'Les techniques de copywriting.',
                            'url' => 'https://www.youtube.com/watch?v=F3KtURWWIn4',
                            'duration' => 1200,
                        ],
                        'markdown' => <<<'MD'
# Copywriting & rédaction web

## Écrire pour convaincre
Le **copywriting** est l'art d'écrire pour **faire agir** : cliquer, s'inscrire,
acheter. On écrit pour le lecteur, pas pour soi.

## Les structures éprouvées
- **AIDA** : Attention → Intérêt → Désir → Action.
- **PAS** : Problème → Agitation → Solution.

## Parler bénéfices, pas caractéristiques
> ❌ « Batterie 5000 mAh » → ✅ « 2 jours d'autonomie sans recharger ».

On traduit chaque caractéristique en **bénéfice concret** pour le client.

## Écrire pour le web
- Phrases courtes, paragraphes aérés.
- L'information importante **en premier** (pyramide inversée).
- Un **appel à l'action** clair et unique.
- Des sous-titres scannables (on lit en diagonale).

## À retenir
- Vendre des bénéfices, pas des caractéristiques.
- Une structure (AIDA/PAS) + un seul CTA = un texte qui convertit.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Copywriting

## Exercice
Pour un coffret de thé découverte :
1. Liste 3 **caractéristiques** et transforme-les en **bénéfices**.
2. Rédige un texte de vente court en structure **AIDA**.
3. Termine par **1 appel à l'action** percutant.
MD,
                    ],
                ],
            ],
            [
                'school' => 'aftec-vannes',
                'teacher' => 'prof.market@monto.test',
                'name' => 'Réseaux sociaux & community management',
                'description' => 'Animer une présence sociale efficace : choix des réseaux, stratégie de contenu et gestion de communauté (y compris en situation de crise).',
                'expected_hours' => 28,
                'classrooms' => ['b3-marketing-digital'],
                'chapters' => [
                    [
                        'title' => 'Animer une communauté',
                        'video' => [
                            'title' => 'Les meilleurs outils de community manager',
                            'description' => 'Boîte à outils du CM.',
                            'url' => 'https://www.youtube.com/watch?v=9cizR-olIKU',
                            'duration' => 1080,
                        ],
                        'pdf' => [
                            'title' => 'Lumière sur les réseaux sociaux (France Num)',
                            'description' => 'Guide pratique d\'animation de communautés.',
                            'url' => 'https://www.francenum.gouv.fr/files/Documents/GuideReseauxSociaux.pdf',
                        ],
                        'markdown' => <<<'MD'
# Animer une communauté

## Le rôle du community manager
Représenter la marque sur les réseaux, créer du lien, publier, modérer et
analyser. À ne pas confondre avec le *social media manager* (qui définit la
stratégie).

## La règle des tiers
Un bon mix de contenus : **informer**, **divertir**, **promouvoir** (sans
sur-vendre).

## Engagement
- Répondre vite et avec le bon ton.
- Animer : questions, sondages, lives, contenu généré par les utilisateurs (UGC).
- Créer de la conversation, pas seulement diffuser.

## Les outils
Planification (Buffer, Metricool), création (Canva), analyse (statistiques
natives).

## À retenir
- Le CM exécute et anime ; le SMM stratège.
- L'engagement prime sur le nombre brut d'abonnés.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Animation

## Exercice
1. Applique la **règle des tiers** : propose 1 post « informer », 1 « divertir », 1 « promouvoir ».
2. Pour chaque post, ajoute une question ou un appel à l'engagement.
3. Cite 1 outil pour planifier et 1 pour créer les visuels.
MD,
                    ],
                    [
                        'title' => 'Stratégie réseaux sociaux',
                        'video' => [
                            'title' => 'Le guide réseaux sociaux : développer une stratégie',
                            'description' => 'Bâtir une stratégie social media.',
                            'url' => 'https://www.youtube.com/watch?v=FpfyjNx_FOU',
                            'duration' => 1200,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Comment créer une stratégie social media marketing ?',
                                'description' => 'Un modèle de stratégie.',
                                'url' => 'https://www.youtube.com/watch?v=JDLkdelBD0U',
                                'duration' => 900,
                            ],
                        ],
                        'pdf' => [
                            'title' => 'Les bonnes pratiques sur les médias sociaux (La Poste)',
                            'description' => 'Guide des médias sociaux.',
                            'url' => 'https://www.eure.gouv.fr/content/download/8632/48747/file/LA%20POSTE%20GUIDE%20MEDIAS%20SOCIAUX.pdf',
                        ],
                        'markdown' => <<<'MD'
# Stratégie réseaux sociaux

## Partir des objectifs
Notoriété ? Trafic ? Conversions ? Communauté ? La stratégie découle de
l'objectif, pas de la mode du moment.

## Choisir ses plateformes
On sélectionne selon la **cible** et le **format** maîtrisé :
- **Instagram / TikTok** : visuel et vidéo courte, audience jeune.
- **LinkedIn** : B2B, expertise, marque employeur.
- **Facebook** : communautés, audience large et locale.

## Les formats qui marchent
Vidéo courte (Reels, TikTok), carrousels, stories, lives. Le format vidéo est
largement favorisé par les algorithmes.

## Mesurer
On suit la **portée**, l'**engagement**, la **croissance** et les **clics**. On
ajuste la stratégie selon ce qui fonctionne réellement.

## À retenir
- Objectif → cible → plateformes → formats (dans cet ordre).
- Tester, mesurer, ajuster : la stratégie sociale est itérative.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Stratégie social

## Exercice
Pour une marque de prêt-à-porter éthique :
1. Fixe **1 objectif** principal.
2. Choisis **2 plateformes** adaptées (justifie).
3. Propose **2 formats** par plateforme et **1 KPI** de suivi.
MD,
                    ],
                    [
                        'title' => 'Calendrier social & gestion de crise',
                        'video' => [
                            'title' => 'Bien communiquer sur les réseaux sociaux en temps de crise',
                            'description' => 'Gérer une situation de crise.',
                            'url' => 'https://www.youtube.com/watch?v=xy3JdRN3Cao',
                            'duration' => 1500,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Gestion de la communication sur les réseaux en temps de crise',
                                'description' => 'Méthode de gestion de crise.',
                                'url' => 'https://www.youtube.com/watch?v=2jNiP8FTYAU',
                                'duration' => 1800,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Calendrier social & gestion de crise

## Le calendrier de publication
Comme en content marketing : on planifie date, plateforme, format, message et
visuel. La **régularité** nourrit l'algorithme et la communauté.

## L'organisation au quotidien
- **Planifier** à l'avance (Buffer, Metricool).
- **Modérer** les commentaires et messages.
- **Veiller** : suivre les mentions de la marque.

## La gestion de crise (bad buzz)
1. **Réagir vite**, mais sans précipitation.
2. **Reconnaître** le problème, ne pas l'effacer en douce.
3. **Répondre** avec transparence et empathie.
4. **Apprendre** : analyser après coup.

## Ce qu'il ne faut PAS faire
Supprimer massivement les commentaires, répondre sur le ton de l'agressivité,
ignorer une crise qui monte.

## À retenir
- Régularité planifiée + veille active.
- En crise : vite, honnête, empathique — jamais l'effacement silencieux.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Gestion de crise

## Exercice
Scénario : un client poste publiquement une photo d'un produit défectueux,
le post devient viral.
1. Rédige une **réponse publique** (transparente, empathique).
2. Indique **2 actions** en coulisses (SAV, suivi).
3. Liste **2 erreurs** à ne surtout pas commettre.
MD,
                    ],
                ],
            ],
            [
                'school' => 'aftec-vannes',
                'teacher' => 'prof.market@monto.test',
                'name' => 'Publicité, emailing & web analytics',
                'description' => 'Activer les leviers payants (SEA), entretenir la relation par e-mail et mesurer la performance avec GA4.',
                'expected_hours' => 32,
                'classrooms' => ['b3-marketing-digital'],
                'chapters' => [
                    [
                        'title' => 'La publicité en ligne (SEA / Google Ads)',
                        'video' => [
                            'title' => 'Tutoriel Google Ads : créer une campagne de A à Z',
                            'description' => 'Guide vidéo Google Ads.',
                            'url' => 'https://www.youtube.com/watch?v=2GllsDRx6V0',
                            'duration' => 1500,
                        ],
                        'markdown' => <<<'MD'
# La publicité en ligne (SEA / Google Ads)

## SEA vs SEO
- **SEO** : visibilité gratuite, sur la durée.
- **SEA** (Search Engine Advertising) : visibilité **payante**, immédiate. On
  paie souvent au clic (**CPC**).

## Le modèle des enchères
Google classe les annonces selon l'**enchère** × le **Quality Score** (qualité
de l'annonce et de la page de destination). Mieux vaut une bonne annonce qu'une
grosse enchère.

## Structurer un compte
```
Compte
 └─ Campagne (objectif, budget)
     └─ Groupe d'annonces (thème, mots-clés)
         └─ Annonces + mots-clés
```

## Les bonnes pratiques
- Mots-clés pertinents + **mots-clés à exclure**.
- Annonces avec un appel à l'action clair.
- **Landing page** alignée sur l'annonce.
- Suivi des **conversions** (sinon on pilote à l'aveugle).

## À retenir
- SEA = résultats rapides mais payants ; le Quality Score réduit les coûts.
- Sans suivi de conversion, impossible de mesurer le ROI.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Google Ads

## Exercice
Pour la boutique de thé :
1. Choisis **5 mots-clés** à acheter et **3 mots-clés à exclure**.
2. Rédige **1 annonce** (titre + description + CTA).
3. Décris la **landing page** idéale pour cette annonce.
MD,
                    ],
                    [
                        'title' => 'Emailing & CRM',
                        'video' => [
                            'title' => 'Formation Brevo : maîtriser l\'email marketing de A à Z',
                            'description' => 'Email marketing avec Brevo.',
                            'url' => 'https://www.youtube.com/watch?v=y4iJqzEwe0g',
                            'duration' => 1800,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Que vaut le CRM Brevo ? Tutoriel débutant',
                                'description' => 'Prise en main d\'un CRM.',
                                'url' => 'https://www.youtube.com/watch?v=DJ6Z9xJBNhg',
                                'duration' => 1200,
                            ],
                        ],
                        'pdf' => [
                            'title' => 'Tutoriel — Campagnes d\'emailing (UCA)',
                            'description' => 'Guide pratique d\'emailing.',
                            'url' => 'https://link.univ-cotedazur.fr/medias/editor/oneshot-images/1629580155e8489bfdffcd.pdf',
                        ],
                        'markdown' => <<<'MD'
# Emailing & CRM

## L'e-mail, canal toujours roi
Direct, mesurable et au **ROI** parmi les plus élevés. On s'adresse à une base
**opt-in** (qui a consenti — obligation RGPD).

## Le CRM
Le **CRM** centralise les contacts et leur historique. On **segmente** la base
(clients, prospects, inactifs) pour envoyer le bon message à la bonne personne.

## Types d'e-mails
- **Newsletter** : régulière, informative.
- **Promotionnel** : offre, lancement.
- **Automatisé (scénario)** : bienvenue, panier abandonné, anniversaire.

## Les KPIs
| KPI | Définition |
| --- | --- |
| Taux d'ouverture | ouvertures / envois |
| Taux de clic (CTR) | clics / envois |
| Taux de désabonnement | à surveiller |
| Délivrabilité | e-mails réellement arrivés |

## À retenir
- Segmenter + automatiser = pertinence et gain de temps.
- L'objet fait l'ouverture ; l'appel à l'action fait la conversion.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Emailing

## Exercice
1. Rédige **3 objets d'e-mail** pour une promo (teste différents angles).
2. Définis un **scénario automatisé** de bienvenue en 3 e-mails.
3. Indique le **KPI** principal pour juger chaque e-mail.
MD,
                    ],
                    [
                        'title' => 'Web analytics avec GA4',
                        'video' => [
                            'title' => 'Formation Google Analytics 4 (GA4) pour débutants',
                            'description' => 'Prendre en main GA4.',
                            'url' => 'https://www.youtube.com/watch?v=D0d8GZAbnaw',
                            'duration' => 2400,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Google Analytics : guide complet pour débutants (GA4)',
                                'description' => 'Tutoriel GA4 pas à pas.',
                                'url' => 'https://www.youtube.com/watch?v=TM7oayOheUg',
                                'duration' => 1800,
                            ],
                        ],
                        'pdf' => [
                            'title' => 'Google Analytics 4 — extrait (ENI)',
                            'description' => 'Extrait du livre GA4 + Google Tag Manager.',
                            'url' => 'https://www.editions-eni.fr/livre/google-analytics-4-pilotez-la-performance-de-votre-site-avec-ga4-et-google-tag-manager-9782409047763/extrait-du-livre.pdf',
                        ],
                        'markdown' => <<<'MD'
# Web analytics avec GA4

## Mesurer pour décider
Sans mesure, le marketing est un pari. **Google Analytics 4** (GA4) suit le
comportement des visiteurs et la performance des canaux.

## Le modèle GA4 : les événements
GA4 ne raisonne plus en « pages vues » mais en **événements** :
`page_view`, `scroll`, `click`, `purchase`… Chaque interaction est un événement.

## Les notions clés
- **Utilisateurs** vs **sessions**.
- **Acquisition** : d'où viennent les visiteurs (organique, payant, social, direct).
- **Engagement** : durée, événements, pages par session.
- **Conversions** : événements marqués comme objectifs (achat, formulaire…).

## Google Tag Manager
GTM permet de poser et gérer les balises de suivi **sans toucher au code** à
chaque fois.

## À retenir
- GA4 = tout est **événement**.
- On mesure le parcours : acquisition → engagement → conversion.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — GA4

## Exercice
À partir d'un rapport GA4 (réel ou fictif) :
1. Identifie les **3 principaux canaux** d'acquisition.
2. Repère la page avec le **meilleur engagement**.
3. Définis **1 conversion** pertinente à suivre et explique pourquoi.
MD,
                    ],
                ],
            ],
        ];
    }

    // ====================================================================
    //  COMMUNICATION & RÉSEAUX SOCIAUX — AFTEC (B2 Communication)
    // ====================================================================

    /** @return array<int, array<string, mixed>> */
    private function communicationCourses(): array
    {
        return [
            [
                'school' => 'aftec-vannes',
                'teacher' => 'prof.market@monto.test',
                'name' => 'Communication digitale & branding',
                'description' => 'Les fondations de la communication digitale : message, identité de marque et plan de communication.',
                'expected_hours' => 26,
                'classrooms' => ['b2-communication-reseaux'],
                'chapters' => [
                    [
                        'title' => 'La communication digitale, c\'est quoi ?',
                        'video' => [
                            'title' => 'Cours complet marketing digital pour débutants',
                            'description' => 'Introduction à la communication et au marketing digital.',
                            'url' => 'https://www.youtube.com/watch?v=i0Dpx_aiDQk',
                            'duration' => 2400,
                        ],
                        'pdf' => [
                            'title' => 'Lumière sur les réseaux sociaux (France Num)',
                            'description' => 'Guide pratique de communication en ligne.',
                            'url' => 'https://www.francenum.gouv.fr/files/Documents/GuideReseauxSociaux.pdf',
                        ],
                        'markdown' => <<<'MD'
# La communication digitale, c'est quoi ?

## Communiquer à l'ère numérique
La communication digitale, c'est diffuser un **message** auprès d'une cible via
les canaux en ligne : site, réseaux sociaux, e-mail, vidéo… Elle complète la
communication traditionnelle (affiche, presse, radio).

## Le schéma de la communication
```
Émetteur → Message → Canal → Récepteur → Feedback
```
La grande nouveauté du digital : le **feedback** est immédiat et public
(commentaires, partages, avis).

## Communication vs marketing
- **Marketing** : vendre, générer des ventes.
- **Communication** : faire connaître, faire aimer, créer une **image**.
Les deux se nourrissent mutuellement.

## Les objectifs de com
Notoriété (être connu), image (être apprécié), engagement (créer du lien),
parfois conversion.

## À retenir
- Communiquer = un message, une cible, un canal, un retour.
- Le digital rend la communication **bidirectionnelle** et mesurable.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Schéma de communication

## Exercice
Choisis une campagne de communication récente d'une marque connue :
1. Identifie l'**émetteur**, le **message**, le **canal**, la **cible**.
2. L'objectif était-il notoriété, image ou engagement ?
3. Comment la marque a-t-elle recueilli le **feedback** ?
MD,
                    ],
                    [
                        'title' => 'Identité de marque & branding',
                        'video' => [
                            'title' => 'Branding de marque : construire son image et son identité visuelle',
                            'description' => 'Les fondamentaux du branding.',
                            'url' => 'https://www.youtube.com/watch?v=psm9_4sHAv0',
                            'duration' => 1080,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Comment créer une marque mémorable — le modèle branding complet',
                                'description' => 'Construire une marque forte.',
                                'url' => 'https://www.youtube.com/watch?v=WXItksWlMDY',
                                'duration' => 900,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Identité de marque & branding

## La marque, plus qu'un logo
Une marque, c'est la **perception** qu'ont les gens d'une entreprise : ce qu'on
en dit quand elle n'est pas dans la pièce. Le **branding** est le travail pour
façonner cette perception.

## Les composantes de l'identité
- **Plateforme de marque** : mission, valeurs, positionnement.
- **Identité verbale** : nom, slogan, ton de voix.
- **Identité visuelle** : logo, couleurs, typographie, imagerie.

## La charte graphique
Document qui fige les règles d'usage de l'identité visuelle (logo, couleurs,
typo, marges) pour garantir la **cohérence** sur tous les supports.

## Pourquoi c'est stratégique
Une marque cohérente est **reconnaissable**, inspire **confiance** et se
différencie de la concurrence.

## À retenir
- La marque = une perception, pas seulement un logo.
- Plateforme de marque → identité verbale + visuelle → charte.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Identité de marque

## Exercice
Invente une marque (nom + activité). Définis :
1. Sa **mission** et 3 **valeurs**.
2. Son **ton de voix** (3 adjectifs).
3. Une mini **identité visuelle** : 2-3 couleurs + 1 idée de logo.

## Bonus
Rédige un slogan en moins de 7 mots.
MD,
                    ],
                    [
                        'title' => 'Construire un plan de communication',
                        'video' => [
                            'title' => 'Faire son plan de communication : les 4 étapes indispensables',
                            'description' => 'Méthode pour bâtir un plan de com.',
                            'url' => 'https://www.youtube.com/watch?v=LPwINbaUveg',
                            'duration' => 720,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Un plan de communication, c\'est quoi ?',
                                'description' => 'Définition et explication.',
                                'url' => 'https://www.youtube.com/watch?v=N2p1Edl4uRA',
                                'duration' => 600,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Construire un plan de communication

## À quoi ça sert ?
Le **plan de communication** transforme des objectifs en actions concrètes,
planifiées et budgétées. Il évite de communiquer « au feeling ».

## Les grandes étapes
1. **Diagnostic** : où en est-on ? (forces/faiblesses, image actuelle).
2. **Objectifs** : SMART (notoriété, image, engagement…).
3. **Cibles** : à qui s'adresse-t-on ?
4. **Message & axes** : quoi dire, sur quel ton.
5. **Moyens & canaux** : quels supports, quel budget.
6. **Planning** : qui fait quoi, quand (rétroplanning).
7. **Évaluation** : quels KPIs pour mesurer.

## Le message clé
Une idée centrale, claire, déclinable sur tous les canaux. Tout le reste en
découle.

## À retenir
- Diagnostic → objectifs → cibles → message → moyens → planning → évaluation.
- Pas de plan sans **KPIs** définis dès le départ.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Plan de com

## Exercice
Pour la marque inventée au chapitre précédent, rédige un mini plan de com :
1. **1 objectif** SMART.
2. **1 cible** principale.
3. **1 message clé**.
4. **2 canaux** et **2 KPIs** de suivi.
MD,
                    ],
                ],
            ],
            [
                'school' => 'aftec-vannes',
                'teacher' => 'prof.market@monto.test',
                'name' => 'Stratégie réseaux sociaux',
                'description' => 'Choisir ses plateformes, définir une ligne éditoriale sociale et piloter sa présence grâce aux KPIs.',
                'expected_hours' => 24,
                'classrooms' => ['b2-communication-reseaux'],
                'chapters' => [
                    [
                        'title' => 'Choisir ses réseaux sociaux',
                        'video' => [
                            'title' => 'Comment créer une stratégie social media marketing ?',
                            'description' => 'Choisir et structurer ses réseaux.',
                            'url' => 'https://www.youtube.com/watch?v=JDLkdelBD0U',
                            'duration' => 900,
                        ],
                        'pdf' => [
                            'title' => 'Les bonnes pratiques sur les médias sociaux (La Poste)',
                            'description' => 'Panorama et bonnes pratiques.',
                            'url' => 'https://www.eure.gouv.fr/content/download/8632/48747/file/LA%20POSTE%20GUIDE%20MEDIAS%20SOCIAUX.pdf',
                        ],
                        'markdown' => <<<'MD'
# Choisir ses réseaux sociaux

## Ne pas être partout
Chaque réseau demande du temps et un format propre. Mieux vaut **2 réseaux bien
tenus** que 5 réseaux abandonnés.

## Panorama des plateformes
| Réseau | Format dominant | Audience |
| --- | --- | --- |
| Instagram | Photo, Reels, Stories | Grand public, jeunes adultes |
| TikTok | Vidéo courte | Très jeune, divertissement |
| LinkedIn | Texte, articles | Professionnels (B2B) |
| Facebook | Mixte, groupes | Large, plutôt 30+ |
| YouTube | Vidéo longue | Tous publics |

## La méthode de choix
1. Où est ma **cible** ?
2. Quel **format** sais-je produire régulièrement ?
3. Quels sont mes **objectifs** ?

## À retenir
- Le bon réseau = intersection cible × format maîtrisable × objectif.
- Concentrer ses efforts plutôt que se disperser.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Choix des réseaux

## Exercice
Pour une association étudiante :
1. Liste sa **cible** principale.
2. Choisis **2 réseaux** et justifie par cible + format.
3. Explique pourquoi tu **écartes** un réseau populaire.
MD,
                    ],
                    [
                        'title' => 'Ligne éditoriale sociale',
                        'video' => [
                            'title' => 'Comment définir sa ligne éditoriale sur les réseaux sociaux ?',
                            'description' => 'Construire une ligne éditoriale.',
                            'url' => 'https://www.youtube.com/watch?v=Z3C4sH2UbqY',
                            'duration' => 780,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Définir sa ligne éditoriale : 2 méthodes simples',
                                'description' => 'Méthodes rapides et concrètes.',
                                'url' => 'https://www.youtube.com/watch?v=R4wK6_Z3iDU',
                                'duration' => 660,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Ligne éditoriale sociale

## Définition
La ligne éditoriale fixe **de quoi** on parle, **sur quel ton** et **pour qui**,
sur les réseaux. C'est ce qui rend un compte reconnaissable et cohérent.

## Les piliers de contenu
3 à 5 grands thèmes récurrents. Exemple pour une marque de café :
- Coulisses (torréfaction, équipe).
- Conseils (préparer un bon café).
- Communauté (avis clients, UGC).
- Offres (nouveautés, promos).

## Les formats récurrents (rubriques)
Des rendez-vous réguliers (« le conseil du lundi », « FAQ du vendredi ») créent
une attente et facilitent la production.

## Le ton de voix
Expert ? Complice ? Drôle ? Le ton doit refléter la marque et rester **constant**.

## À retenir
- Piliers + rubriques + ton constant = identité éditoriale claire.
- Une ligne éditoriale évite la panne d'idées et la dispersion.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Ligne éditoriale

## Exercice
Pour l'association du chapitre précédent :
1. Définis **4 piliers de contenu**.
2. Invente **2 rubriques récurrentes**.
3. Choisis un **ton de voix** (3 adjectifs) et écris 1 légende d'exemple.
MD,
                    ],
                    [
                        'title' => 'Mesurer ses réseaux : les KPIs',
                        'video' => [
                            'title' => 'Comment analyser ses résultats et KPI sur les réseaux sociaux',
                            'description' => 'Suivre et interpréter ses statistiques.',
                            'url' => 'https://www.youtube.com/watch?v=VPpAfri4XI0',
                            'duration' => 840,
                        ],
                        'markdown' => <<<'MD'
# Mesurer ses réseaux : les KPIs

## Pourquoi mesurer ?
Pour savoir ce qui marche, ajuster, et prouver la valeur de son travail. « Ce
qui ne se mesure pas ne s'améliore pas. »

## Les grands indicateurs
| KPI | Ce qu'il mesure |
| --- | --- |
| Portée / impressions | Combien de personnes ont vu |
| Taux d'engagement | (likes + commentaires + partages) / portée |
| Croissance abonnés | Évolution de la communauté |
| Clics / trafic | Visites générées vers le site |
| Taux de conversion | Actions concrètes (achat, inscription) |

## Vanity metrics vs métriques utiles
Le nombre d'abonnés flatte mais informe peu. Le **taux d'engagement** et les
**conversions** comptent davantage.

## Le reporting
Un tableau de bord régulier (mensuel) compare les résultats aux objectifs et
guide les décisions.

## À retenir
- Privilégier engagement et conversions aux « vanity metrics ».
- Mesurer régulièrement et comparer aux objectifs.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — KPIs

## Exercice
On te donne : un post vu par 5 000 personnes, 250 likes, 30 commentaires, 20 partages.
1. Calcule le **taux d'engagement**.
2. Est-ce un bon score selon toi ? Pourquoi ?
3. Cite 1 « vanity metric » à ne pas sur-interpréter.
MD,
                    ],
                ],
            ],
            [
                'school' => 'aftec-vannes',
                'teacher' => 'prof.market@monto.test',
                'name' => 'Création de contenu social',
                'description' => 'Produire des contenus qui captent l\'attention : visuels avec Canva, vidéos courtes et storytelling.',
                'expected_hours' => 24,
                'classrooms' => ['b2-communication-reseaux'],
                'chapters' => [
                    [
                        'title' => 'Créer ses visuels avec Canva',
                        'video' => [
                            'title' => 'Tutoriel complet Canva en français (pour débutants)',
                            'description' => 'Prise en main de Canva.',
                            'url' => 'https://www.youtube.com/watch?v=Fh7OH90vIzU',
                            'duration' => 1800,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Comment utiliser Canva : le guide complet de A à Z',
                                'description' => 'Guide Canva détaillé.',
                                'url' => 'https://www.youtube.com/watch?v=kKKHqD-CJf8',
                                'duration' => 2100,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Créer ses visuels avec Canva

## Pourquoi Canva ?
Outil de création graphique **simple** et gratuit, pensé pour les non-designers.
Idéal pour produire vite des visuels réseaux sociaux cohérents.

## Les bases
- Partir d'un **modèle** au bon format (post carré, story, bannière).
- **Kit de marque** : enregistrer ses couleurs, polices et logo (cohérence).
- Glisser-déposer : textes, images, éléments, icônes.

## Les bons réflexes design
- Respecter la **hiérarchie** : 1 message principal par visuel.
- Garder de l'**espace** (ne pas tout remplir).
- Rester **cohérent** avec la charte (mêmes couleurs/polices).
- Soigner la **lisibilité** (contraste texte/fond).

## Exporter
Au bon format et au bon poids : PNG pour les visuels nets, MP4 pour les vidéos.

## À retenir
- Modèle + kit de marque = visuels rapides et cohérents.
- 1 visuel = 1 message ; lisibilité avant décoration.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Canva

## Exercice
1. Crée un **kit de marque** (2-3 couleurs + 1 police) dans Canva.
2. Réalise **3 posts** Instagram cohérents (même style) sur un thème.
3. Vérifie la lisibilité du texte sur chaque visuel.
MD,
                    ],
                    [
                        'title' => 'Vidéo courte : Reels & TikTok',
                        'video' => [
                            'title' => 'Apprendre le montage vidéo sur CapCut en 15 min',
                            'description' => 'Monter une vidéo courte (débutant).',
                            'url' => 'https://www.youtube.com/watch?v=MwEMHRQoSV4',
                            'duration' => 900,
                        ],
                        'extra_videos' => [
                            [
                                'title' => 'Tuto CapCut : le meilleur tutoriel pour débuter',
                                'description' => 'Maîtriser CapCut.',
                                'url' => 'https://www.youtube.com/watch?v=R6P3SSgXp1Y',
                                'duration' => 1500,
                            ],
                        ],
                        'markdown' => <<<'MD'
# Vidéo courte : Reels & TikTok

## Le format roi
La **vidéo courte** verticale (Reels, TikTok, Shorts) est massivement poussée
par les algorithmes. C'est aujourd'hui le format le plus efficace pour la portée.

## L'anatomie d'une bonne vidéo courte
1. **Le hook** (3 premières secondes) : capter immédiatement (« Tu fais cette
   erreur ? »).
2. **La valeur** : une idée claire, rythmée.
3. **Le CTA** : « Abonne-toi », « Commente », « Lien en bio ».

## Les codes à respecter
- Format **vertical 9:16**.
- **Sous-titres** (beaucoup regardent sans le son).
- Rythme rapide, coupes nettes.
- Tendances : sons et formats du moment.

## Le montage (CapCut)
Découper, ajouter du texte, des sous-titres automatiques, de la musique, des
transitions — le tout depuis le mobile.

## À retenir
- Les 3 premières secondes décident de tout (le hook).
- Vertical + sous-titres + rythme + CTA = base d'un bon Reel.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Reel / TikTok

## Exercice
Crée une vidéo courte (15-30 s) sur un sujet de ton choix :
1. Écris ton **hook** (3 premières secondes).
2. Filme et monte sur **CapCut** (texte + sous-titres + musique).
3. Termine par un **appel à l'action** clair.
MD,
                    ],
                    [
                        'title' => 'Storytelling & contenu engageant',
                        'video' => [
                            'title' => 'Storytelling : raconter l\'histoire d\'une marque',
                            'description' => 'Les ressorts du storytelling.',
                            'url' => 'https://www.youtube.com/watch?v=XOr5__wRHDo',
                            'duration' => 2400,
                        ],
                        'markdown' => <<<'MD'
# Storytelling & contenu engageant

## Pourquoi raconter des histoires ?
Le cerveau retient mieux une **histoire** qu'une liste d'arguments. Le
storytelling crée de l'émotion, donc de la mémorisation et de l'attachement.

## La structure narrative de base
```
Situation → Élément déclencheur → Péripéties → Résolution → Transformation
```
On retrouve ce schéma dans presque toutes les histoires (le « voyage du héros »).

## Le client est le héros, pas la marque
La marque joue le rôle du **guide** qui aide le héros (le client) à surmonter un
obstacle. On parle du client, pas (que) de soi.

## Créer de l'engagement
- Poser des **questions**, inviter à réagir.
- Montrer les **coulisses**, l'humain derrière la marque.
- Susciter une **émotion** (surprise, inspiration, humour).

## À retenir
- Une histoire > une liste d'arguments.
- Le client est le héros ; la marque est le guide.
MD,
                        'exercise' => <<<'MD'
# À pratiquer — Storytelling

## Exercice
Pour une marque (réelle ou inventée) :
1. Raconte son histoire en suivant la structure narrative (situation → transformation).
2. Place le **client** en héros et la marque en **guide**.
3. Rédige un post de 5-6 phrases qui suscite une **émotion** précise.
MD,
                    ],
                ],
            ],
        ];
    }
}
