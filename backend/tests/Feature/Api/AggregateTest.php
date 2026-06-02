<?php

namespace Tests\Feature\Api;

use App\Models\Chapter;
use App\Models\Classroom;
use App\Models\School;
use App\Models\Subject;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AggregateTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Crée l'arbre complet : école → classe → matière → chapitre → N vidéos.
     * Retourne tous les objets pour les assertions.
     */
    private function setupSchool(int $videoCount = 2): array
    {
        $school    = School::factory()->create();
        $teacher   = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $school->id]);
        $admin     = User::factory()->create(['role' => User::ROLE_ADMIN,   'school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $subject   = Subject::factory()->create(['school_id' => $school->id, 'teacher_id' => $teacher->id]);
        $classroom->subjects()->attach($subject->id);
        $chapter   = Chapter::factory()->create(['subject_id' => $subject->id]);
        $student   = User::factory()->create([
            'role'         => User::ROLE_STUDENT,
            'school_id'    => $school->id,
            'classroom_id' => $classroom->id,
        ]);

        $videos = collect(range(1, $videoCount))->map(fn ($i) => Video::factory()->create([
            'chapter_id'       => $chapter->id,
            'duration_seconds' => 300,
            'sort_order'       => $i,
        ]));

        return compact('school', 'teacher', 'admin', 'classroom', 'subject', 'chapter', 'student', 'videos');
    }

    // -------------------------------------------------------------------------
    // GET /api/aggregates/teacher
    // -------------------------------------------------------------------------

    public function test_teacher_aggregate_returns_401_without_auth(): void
    {
        $this->getJson('/api/aggregates/teacher')->assertUnauthorized();
    }

    public function test_student_cannot_access_teacher_aggregate(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/aggregates/teacher')->assertForbidden();
    }

    public function test_teacher_sees_own_subjects_with_students(): void
    {
        ['teacher' => $teacher, 'subject' => $subject, 'classroom' => $classroom, 'student' => $student] = $this->setupSchool();
        Sanctum::actingAs($teacher);

        $response = $this->getJson('/api/aggregates/teacher')->assertOk();

        $this->assertCount(1, $response->json());
        $this->assertEquals($subject->id, $response->json('0.id'));
        $this->assertEquals($subject->name, $response->json('0.name'));
        $this->assertCount(1, $response->json('0.classrooms'));
        $this->assertEquals($classroom->id, $response->json('0.classrooms.0.id'));
        $this->assertCount(1, $response->json('0.classrooms.0.students'));
        $this->assertEquals($student->id, $response->json('0.classrooms.0.students.0.id'));
    }

    public function test_teacher_sees_correct_video_counts(): void
    {
        ['teacher' => $teacher, 'videos' => $videos] = $this->setupSchool(videoCount: 3);
        Sanctum::actingAs($teacher);

        $response = $this->getJson('/api/aggregates/teacher')->assertOk();

        $this->assertEquals(3, $response->json('0.totalVideos'));
    }

    public function test_teacher_aggregate_shows_zero_progress_when_no_viewing(): void
    {
        ['teacher' => $teacher] = $this->setupSchool();
        Sanctum::actingAs($teacher);

        $response  = $this->getJson('/api/aggregates/teacher')->assertOk();
        $progress  = $response->json('0.classrooms.0.students.0.progress');

        $this->assertEquals(0, $progress['completedVideos']);
        $this->assertEquals(0, $progress['watchedSeconds']);
        $this->assertEquals(0.0, $progress['completionPercent']);
    }

    public function test_teacher_aggregate_reflects_student_progress(): void
    {
        ['teacher' => $teacher, 'student' => $student, 'videos' => $videos] = $this->setupSchool(videoCount: 2);

        // L'élève a complété la première vidéo
        VideoProgress::factory()->create([
            'user_id'                   => $student->id,
            'video_id'                  => $videos->first()->id,
            'watched_seconds_validated' => 300,
            'completion_percent'        => 100.0,
            'status'                    => 'completed',
        ]);

        Sanctum::actingAs($teacher);
        $response = $this->getJson('/api/aggregates/teacher')->assertOk();
        $progress = $response->json('0.classrooms.0.students.0.progress');

        $this->assertEquals(1, $progress['completedVideos']);
        $this->assertEquals(1, $progress['notStartedVideos']);
        $this->assertEquals(300, $progress['watchedSeconds']);
        $this->assertEquals(50.0, $progress['completionPercent']); // 300/600 = 50%
    }

    public function test_teacher_does_not_see_other_teacher_subjects(): void
    {
        ['teacher' => $teacher] = $this->setupSchool();

        $otherTeacher = User::factory()->create(['role' => User::ROLE_TEACHER]);
        Subject::factory()->create(['teacher_id' => $otherTeacher->id]);

        Sanctum::actingAs($teacher);
        $response = $this->getJson('/api/aggregates/teacher')->assertOk();

        // Seule la matière du teacher connecté
        $this->assertCount(1, $response->json());
    }

    public function test_admin_can_access_teacher_aggregate(): void
    {
        ['admin' => $admin] = $this->setupSchool();
        Sanctum::actingAs($admin);

        $this->getJson('/api/aggregates/teacher')->assertOk();
    }

    public function test_admin_can_filter_by_teacher_id(): void
    {
        ['admin' => $admin, 'teacher' => $teacher, 'subject' => $subject] = $this->setupSchool();

        // Autre matière dans la même école mais différent teacher
        $otherTeacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $admin->school_id]);
        Subject::factory()->create(['school_id' => $admin->school_id, 'teacher_id' => $otherTeacher->id]);

        Sanctum::actingAs($admin);
        $response = $this->getJson('/api/aggregates/teacher?teacher_id=' . $teacher->id)->assertOk();

        $this->assertCount(1, $response->json());
        $this->assertEquals($subject->id, $response->json('0.id'));
    }

    // -------------------------------------------------------------------------
    // GET /api/aggregates/school
    // -------------------------------------------------------------------------

    public function test_school_aggregate_returns_401_without_auth(): void
    {
        $this->getJson('/api/aggregates/school')->assertUnauthorized();
    }

    public function test_teacher_cannot_access_school_aggregate(): void
    {
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER]);
        Sanctum::actingAs($teacher);

        $this->getJson('/api/aggregates/school')->assertForbidden();
    }

    public function test_student_cannot_access_school_aggregate(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/aggregates/school')->assertForbidden();
    }

    public function test_school_aggregate_returns_classrooms_with_students(): void
    {
        ['admin' => $admin, 'classroom' => $classroom, 'student' => $student] = $this->setupSchool();
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/aggregates/school')->assertOk();

        $this->assertCount(1, $response->json());
        $this->assertEquals($classroom->id, $response->json('0.id'));
        $this->assertCount(1, $response->json('0.students'));
        $this->assertEquals($student->id, $response->json('0.students.0.id'));
    }

    public function test_school_aggregate_includes_subject_progress_per_student(): void
    {
        ['admin' => $admin, 'subject' => $subject, 'student' => $student, 'videos' => $videos] = $this->setupSchool(videoCount: 2);

        VideoProgress::factory()->create([
            'user_id'                   => $student->id,
            'video_id'                  => $videos->first()->id,
            'watched_seconds_validated' => 300,
            'completion_percent'        => 100.0,
            'status'                    => 'completed',
        ]);

        Sanctum::actingAs($admin);
        $response = $this->getJson('/api/aggregates/school')->assertOk();

        $subjects = $response->json('0.students.0.subjects');
        $this->assertCount(1, $subjects);
        $this->assertEquals($subject->id, $subjects[0]['subjectId']);
        $this->assertEquals(1, $subjects[0]['completedVideos']);
        $this->assertEquals(300, $subjects[0]['watchedSeconds']);
    }

    public function test_school_aggregate_only_returns_own_school_classrooms(): void
    {
        ['admin' => $admin] = $this->setupSchool();

        // Classe dans une autre école
        $otherSchool = School::factory()->create();
        Classroom::factory()->create(['school_id' => $otherSchool->id]);

        Sanctum::actingAs($admin);
        $response = $this->getJson('/api/aggregates/school')->assertOk();

        // Seule la classe de l'école de l'admin
        $this->assertCount(1, $response->json());
    }

    public function test_school_aggregate_progress_is_zero_when_no_viewing(): void
    {
        ['admin' => $admin] = $this->setupSchool();
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/aggregates/school')->assertOk();

        $subjectProgress = $response->json('0.students.0.subjects.0');
        $this->assertEquals(0, $subjectProgress['completedVideos']);
        $this->assertEquals(0, $subjectProgress['watchedSeconds']);
        $this->assertEquals(0.0, $subjectProgress['completionPercent']);
    }

    public function test_completion_percent_is_calculated_from_duration(): void
    {
        ['teacher' => $teacher, 'student' => $student, 'videos' => $videos] = $this->setupSchool(videoCount: 4);

        // 2 vidéos sur 4 complétées → 600s sur 1200s = 50%
        foreach ($videos->take(2) as $video) {
            VideoProgress::factory()->create([
                'user_id'                   => $student->id,
                'video_id'                  => $video->id,
                'watched_seconds_validated' => 300,
                'status'                    => 'completed',
            ]);
        }

        Sanctum::actingAs($teacher);
        $response = $this->getJson('/api/aggregates/teacher')->assertOk();
        $progress = $response->json('0.classrooms.0.students.0.progress');

        $this->assertEquals(50.0, $progress['completionPercent']);
        $this->assertEquals(600, $progress['watchedSeconds']);
        $this->assertEquals(2, $progress['completedVideos']);
        $this->assertEquals(2, $progress['notStartedVideos']);
    }
}
