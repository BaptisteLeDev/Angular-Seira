<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_school', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'school_id']);
        });

        // Backfill : migre les school_id existants dans le pivot
        $rows = DB::table('users')
            ->whereNotNull('school_id')
            ->select('id', 'school_id')
            ->get()
            ->map(fn ($u) => [
                'user_id'    => $u->id,
                'school_id'  => $u->school_id,
                'created_at' => now(),
                'updated_at' => now(),
            ])
            ->all();

        if (!empty($rows)) {
            DB::table('user_school')->insertOrIgnore($rows);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_school');
    }
};
