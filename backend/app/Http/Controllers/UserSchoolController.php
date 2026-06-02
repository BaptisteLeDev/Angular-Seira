<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserSchoolController extends Controller
{
    public function index(int $id): JsonResponse
    {
        $this->requireAdmin();

        $user = User::findOrFail($id);

        return response()->json(
            $user->schools->map(fn (School $s) => [
                'id'   => $s->id,
                'name' => $s->name,
                'slug' => $s->slug,
            ])->values()
        );
    }

    public function assign(Request $request, int $id): JsonResponse
    {
        $this->requireAdmin();

        $request->validate(['school_id' => ['required', 'integer', 'exists:schools,id']]);

        $user     = User::findOrFail($id);
        $schoolId = $request->integer('school_id');

        if ($user->role === User::ROLE_STUDENT) {
            $currentSchoolId = $user->schools()->value('school_id');

            if ($currentSchoolId === $schoolId) {
                return response()->json(['message' => 'L\'élève est déjà dans cette école.'], 409);
            }

            if ($currentSchoolId !== null) {
                $user->schools()->detach($currentSchoolId);
                $user->classroom_id = null;
            }

            $user->schools()->attach($schoolId);
            $user->school_id = $schoolId;
            $user->save();

            return response()->json(['message' => 'Élève transféré vers l\'école.', 'school_id' => $schoolId]);
        }

        if ($user->schools()->whereKey($schoolId)->exists()) {
            return response()->json(['message' => 'L\'utilisateur est déjà assigné à cette école.'], 409);
        }

        $user->schools()->attach($schoolId);

        if ($user->school_id === null) {
            $user->update(['school_id' => $schoolId]);
        }

        return response()->json(['message' => 'Utilisateur assigné à l\'école.', 'school_id' => $schoolId], 201);
    }

    public function remove(int $id, int $schoolId): JsonResponse
    {
        $this->requireAdmin();

        $user = User::findOrFail($id);

        if (!$user->schools()->whereKey($schoolId)->exists()) {
            return response()->json(['message' => 'L\'utilisateur n\'est pas dans cette école.'], 404);
        }

        $user->schools()->detach($schoolId);

        if ($user->role === User::ROLE_STUDENT) {
            $user->update(['school_id' => null, 'classroom_id' => null]);
        } elseif ($user->school_id === $schoolId) {
            $user->update(['school_id' => $user->schools()->value('school_id')]);
        }

        return response()->json(['message' => 'Utilisateur retiré de l\'école.']);
    }

    private function requireAdmin(): void
    {
        /** @var User|null $user */
        $user = Auth::user();
        if (!$user?->isAdmin()) {
            abort(403, 'Accès réservé aux administrateurs.');
        }
    }
}
