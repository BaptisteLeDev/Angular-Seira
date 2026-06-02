<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserSchoolController extends Controller
{
    // -------------------------------------------------------------------------
    // GET /api/users/{id}/schools
    // Liste toutes les écoles d'un utilisateur.
    // -------------------------------------------------------------------------

    public function index(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        return response()->json(
            $user->schools()->get()->map(fn (School $s) => [
                'id'   => $s->id,
                'name' => $s->name,
                'slug' => $s->slug,
            ])->values()
        );
    }

    // -------------------------------------------------------------------------
    // POST /api/users/{id}/schools
    // Assigne un utilisateur à une école.
    //
    // Règles métier :
    //   - Élève  : max 1 école simultanée. Si déjà dans une école, l'ancienne
    //              est remplacée automatiquement (transfert) et classroom_id est vidé.
    //   - Autres : plusieurs écoles possibles. Retourne 409 si déjà assigné.
    // -------------------------------------------------------------------------

    public function assign(Request $request, int $id): JsonResponse
    {
        $request->validate(['school_id' => ['required', 'integer', 'exists:schools,id']]);

        $user     = User::findOrFail($id);
        $schoolId = $request->integer('school_id');
        $school   = School::findOrFail($schoolId);

        if ($user->role === User::ROLE_STUDENT) {
            $currentSchoolId = $user->schools()->value('school_id');

            if ($currentSchoolId !== null && $currentSchoolId !== $schoolId) {
                // Transfert : détache l'ancienne école et remet classroom_id à null
                $user->schools()->detach($currentSchoolId);
                $user->classroom_id = null;
            }

            if ($currentSchoolId === $schoolId) {
                return response()->json(['message' => 'L\'élève est déjà dans cette école.'], 409);
            }

            $user->schools()->attach($schoolId);
            $user->school_id = $schoolId;
            $user->save();

            return response()->json([
                'message'   => 'Élève transféré vers l\'école.',
                'school_id' => $schoolId,
            ]);
        }

        // Teacher / Admin : multi-école
        if ($user->schools()->where('school_id', $schoolId)->exists()) {
            return response()->json(['message' => 'L\'utilisateur est déjà assigné à cette école.'], 409);
        }

        $user->schools()->attach($schoolId);

        // Mise à jour de school_id si l'utilisateur n'en avait pas encore
        if ($user->school_id === null) {
            $user->school_id = $schoolId;
            $user->save();
        }

        return response()->json([
            'message'   => 'Utilisateur assigné à l\'école.',
            'school_id' => $schoolId,
        ], 201);
    }

    // -------------------------------------------------------------------------
    // DELETE /api/users/{id}/schools/{schoolId}
    // Retire un utilisateur d'une école.
    //
    // Règles métier :
    //   - Élève  : school_id et classroom_id sont vidés.
    //   - Autres : si c'était leur school_id principal, il est mis à jour
    //              avec une autre école du pivot (ou null s'il n'en reste plus).
    // -------------------------------------------------------------------------

    public function remove(int $id, int $schoolId): JsonResponse
    {
        $user = User::findOrFail($id);

        if (!$user->schools()->where('school_id', $schoolId)->exists()) {
            return response()->json(['message' => 'L\'utilisateur n\'est pas dans cette école.'], 404);
        }

        $user->schools()->detach($schoolId);

        if ($user->role === User::ROLE_STUDENT) {
            $user->school_id    = null;
            $user->classroom_id = null;
            $user->save();
        } elseif ($user->school_id === $schoolId) {
            // Recalcule le school_id principal parmi les écoles restantes
            $user->school_id = $user->schools()->value('school_id');
            $user->save();
        }

        return response()->json(['message' => 'Utilisateur retiré de l\'école.']);
    }
}
