<?php

namespace Database\Seeders;

use App\Models\Chapter;
use App\Models\ChapterContent;
use App\Models\Classroom;
use App\Models\School;
use App\Models\Subject;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoProgress;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $schools = [];

        foreach ($this->schoolDefinitions() as $schoolDefinition) {
            $schools[$schoolDefinition['slug']] = School::factory()->create($schoolDefinition);
        }

        $classrooms = [];

        foreach ($this->classroomDefinitions() as $schoolSlug => $schoolClassrooms) {
            foreach ($schoolClassrooms as $classroomDefinition) {
                $classroom = Classroom::factory()->create([
                    'school_id' => $schools[$schoolSlug]->id,
                    'level' => $classroomDefinition['level'],
                    'name' => $classroomDefinition['name'],
                    'slug' => $classroomDefinition['slug'],
                ]);

                $classrooms[$schoolSlug][$classroom->slug] = $classroom;
            }
        }

        $myDigitalSchool = $schools['mydigitalschool-vannes'];
        $myDigitalSchoolTeacher = User::query()->updateOrCreate(
            ['email' => 'prof@monto.test'],
            [
                'school_id' => $myDigitalSchool->id,
                'name' => 'Prof Monto',
                'password' => Hash::make('Prof123!'),
                'role' => User::ROLE_TEACHER,
                'email_verified_at' => now(),
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'admin@monto.test'],
            [
                'school_id' => $myDigitalSchool->id,
                'name' => 'Admin Monto',
                'password' => Hash::make('Admin123!'),
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => now(),
            ]
        );

        $student = User::query()->updateOrCreate(
            ['email' => 'eleve@monto.test'],
            [
                'school_id' => $myDigitalSchool->id,
                'classroom_id' => $classrooms['mydigitalschool-vannes']['b3-developpeur-web']->id,
                'name' => 'Eleve Monto',
                'password' => Hash::make('Eleve123!'),
                'role' => User::ROLE_STUDENT,
                'email_verified_at' => now(),
            ]
        );

        foreach ($this->subjectDefinitions() as $subjectDefinition) {
            $subject = Subject::factory()->create([
                'school_id' => $myDigitalSchool->id,
                'teacher_id' => $myDigitalSchoolTeacher->id,
                'name' => $subjectDefinition['name'],
                'description' => $subjectDefinition['description'],
                'referential_file_path' => null,
                'expected_hours' => $subjectDefinition['expected_hours'],
            ]);

            foreach ($subjectDefinition['classroom_slugs'] as $classroomSlug) {
                $subject->classrooms()->syncWithoutDetaching($classrooms['mydigitalschool-vannes'][$classroomSlug]->id);
            }

            foreach ($this->chapterDefinitionsForSubject($subjectDefinition['name']) as $sortOrder => $chapterTitle) {
                $chapter = Chapter::factory()->create([
                    'subject_id' => $subject->id,
                    'title' => $chapterTitle,
                    'sort_order' => $sortOrder + 1,
                ]);

                Video::factory()->create([
                    'chapter_id' => $chapter->id,
                    'created_by' => $myDigitalSchoolTeacher->id,
                    'title' => 'Cours video - '.$chapterTitle,
                    'description' => 'Version video du chapitre.',
                    'source_url' => 'https://example.com/course-videos/'.\Illuminate\Support\Str::slug($chapterTitle),
                    'duration_seconds' => 420,
                    'sort_order' => 1,
                    'is_published' => true,
                ]);

                foreach ($this->chapterContentDefinitionsForChapter($chapterTitle) as $contentSortOrder => $contentDefinition) {
                    ChapterContent::factory()->create([
                        'chapter_id' => $chapter->id,
                        'created_by' => $myDigitalSchoolTeacher->id,
                        'type' => $contentDefinition['type'],
                        'title' => $contentDefinition['title'],
                        'description' => $contentDefinition['description'],
                        'content' => $contentDefinition['content'],
                        'source_url' => $contentDefinition['source_url'],
                        'file_path' => $contentDefinition['file_path'],
                        'duration_seconds' => $contentDefinition['duration_seconds'],
                        'sort_order' => $contentSortOrder + 1,
                        'is_published' => true,
                    ]);
                }

                $seededVideo = Video::query()->where('chapter_id', $chapter->id)->where('sort_order', 1)->first();

                if ($seededVideo !== null) {
                    VideoProgress::factory()->create([
                        'user_id' => $student->id,
                        'video_id' => $seededVideo->id,
                        'watched_seconds_validated' => 120,
                        'completion_percent' => 35,
                        'status' => 'in_progress',
                        'last_seen_at' => now(),
                    ]);
                }
            }
        }
    }

    private function chapterDefinitionsForSubject(string $subjectName): array
    {
        return [
            'Introduction - '.$subjectName,
            'Concepts essentiels - '.$subjectName,
            'Atelier pratique - '.$subjectName,
        ];
    }

    private function chapterContentDefinitionsForChapter(string $chapterTitle): array
    {
        return [
            [
                'type' => 'markdown',
                'title' => 'Notes - '.$chapterTitle,
                'description' => 'Support de cours au format markdown.',
                'content' => '# '.$chapterTitle."\n\nContenu de reference du chapitre.",
                'source_url' => null,
                'file_path' => null,
                'duration_seconds' => 0,
            ],
            [
                'type' => 'video',
                'title' => 'Video - '.$chapterTitle,
                'description' => 'Capsule video associee au chapitre.',
                'content' => null,
                'source_url' => 'https://example.com/videos/'.\Illuminate\Support\Str::slug($chapterTitle),
                'file_path' => null,
                'duration_seconds' => 420,
            ],
            [
                'type' => 'pdf',
                'title' => 'Ressource PDF - '.$chapterTitle,
                'description' => 'Fiche ou support PDF du chapitre.',
                'content' => null,
                'source_url' => null,
                'file_path' => 'seeded-files/'.\Illuminate\Support\Str::slug($chapterTitle).'.pdf',
                'duration_seconds' => 0,
            ],
        ];
    }

    private function schoolDefinitions(): array
    {
        return [
            [
                'name' => 'MyDigitalSchool Vannes',
                'slug' => 'mydigitalschool-vannes',
            ],
            [
                'name' => 'AFTEC Vannes',
                'slug' => 'aftec-vannes',
            ],
            [
                'name' => 'MBway Vannes',
                'slug' => 'mbway-vannes',
            ],
            [
                'name' => 'IHECF Vannes',
                'slug' => 'ihecf-vannes',
            ],
            [
                'name' => 'WIN Sport School Vannes',
                'slug' => 'win-sport-school-vannes',
            ],
        ];
    }

    private function classroomDefinitions(): array
    {
        return [
            'mydigitalschool-vannes' => [
                [
                    'level' => 'B1',
                    'name' => 'B1 Developpeur Web',
                    'slug' => 'b1-developpeur-web',
                ],
                [
                    'level' => 'B2',
                    'name' => 'B2 Developpeur Web',
                    'slug' => 'b2-developpeur-web',
                ],
                [
                    'level' => 'B3',
                    'name' => 'B3 Developpeur Web',
                    'slug' => 'b3-developpeur-web',
                ],
                [
                    'level' => 'B3',
                    'name' => 'B3 Marketing Digital',
                    'slug' => 'b3-marketing-digital',
                ],
                [
                    'level' => 'B3',
                    'name' => 'B3 UX UI Design',
                    'slug' => 'b3-ux-ui-design',
                ],
            ],
            'aftec-vannes' => [
                [
                    'level' => 'BTS1',
                    'name' => 'BTS 1 GPME',
                    'slug' => 'bts-1-gpme',
                ],
                [
                    'level' => 'BTS2',
                    'name' => 'BTS 2 GPME',
                    'slug' => 'bts-2-gpme',
                ],
                [
                    'level' => 'BTS1',
                    'name' => 'BTS 1 NDRC',
                    'slug' => 'bts-1-ndrc',
                ],
                [
                    'level' => 'BTS2',
                    'name' => 'BTS 2 NDRC',
                    'slug' => 'bts-2-ndrc',
                ],
            ],
            'mbway-vannes' => [
                [
                    'level' => 'B3',
                    'name' => 'B3 Commerce Marketing',
                    'slug' => 'b3-commerce-marketing',
                ],
                [
                    'level' => 'MBA1',
                    'name' => 'MBA 1 Management',
                    'slug' => 'mba-1-management',
                ],
                [
                    'level' => 'MBA2',
                    'name' => 'MBA 2 Management',
                    'slug' => 'mba-2-management',
                ],
            ],
            'ihecf-vannes' => [
                [
                    'level' => 'BTS1',
                    'name' => 'BTS 1 Comptabilite Gestion',
                    'slug' => 'bts-1-comptabilite-gestion',
                ],
                [
                    'level' => 'BTS2',
                    'name' => 'BTS 2 Comptabilite Gestion',
                    'slug' => 'bts-2-comptabilite-gestion',
                ],
                [
                    'level' => 'B3',
                    'name' => 'B3 Controle de Gestion',
                    'slug' => 'b3-controle-de-gestion',
                ],
            ],
            'win-sport-school-vannes' => [
                [
                    'level' => 'B3',
                    'name' => 'B3 Sport Business',
                    'slug' => 'b3-sport-business',
                ],
                [
                    'level' => 'B2',
                    'name' => 'B2 Sport Business',
                    'slug' => 'b2-sport-business',
                ],
            ],
        ];
    }

    private function subjectDefinitions(): array
    {
        return [
            [
                'name' => 'Architecture web',
                'description' => 'Organisation et structure des applications web.',
                'expected_hours' => 28,
                'classroom_slugs' => ['b3-developpeur-web', 'b3-ux-ui-design'],
            ],
            [
                'name' => 'Developpement frontend',
                'description' => 'Integration et comportement cote client.',
                'expected_hours' => 36,
                'classroom_slugs' => ['b3-developpeur-web'],
            ],
            [
                'name' => 'Developpement backend',
                'description' => 'Services applicatifs, logique metier et persistence.',
                'expected_hours' => 40,
                'classroom_slugs' => ['b3-developpeur-web'],
            ],
            [
                'name' => 'API Platform',
                'description' => 'Conception et exposition de ressources API.',
                'expected_hours' => 24,
                'classroom_slugs' => ['b3-developpeur-web'],
            ],
            [
                'name' => 'UX UI Design',
                'description' => 'Parcours utilisateur, interface et maquettes.',
                'expected_hours' => 20,
                'classroom_slugs' => ['b3-developpeur-web', 'b3-ux-ui-design'],
            ],
            [
                'name' => 'Gestion de projet',
                'description' => 'Methodes, planning et coordination d equipe.',
                'expected_hours' => 18,
                'classroom_slugs' => ['b3-developpeur-web', 'b3-marketing-digital', 'b3-ux-ui-design'],
            ],
            [
                'name' => 'SEO Analytics',
                'description' => 'Visibilite, mesure et optimisation de la performance.',
                'expected_hours' => 16,
                'classroom_slugs' => ['b3-marketing-digital'],
            ],
            [
                'name' => 'Communication digitale',
                'description' => 'Strategie de contenu et animation de presence en ligne.',
                'expected_hours' => 22,
                'classroom_slugs' => ['b3-marketing-digital'],
            ],
        ];
    }
}
