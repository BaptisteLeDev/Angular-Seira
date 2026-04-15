<?php

namespace Database\Seeders;

use App\Models\User;
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
        User::query()->updateOrCreate(
            ['email' => 'admin@monto.test'],
            [
                'name' => 'Admin Monto',
                'password' => Hash::make('Admin123!'),
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => now(),
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'prof@monto.test'],
            [
                'name' => 'Prof Monto',
                'password' => Hash::make('Prof123!'),
                'role' => User::ROLE_TEACHER,
                'email_verified_at' => now(),
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'eleve@monto.test'],
            [
                'name' => 'Eleve Monto',
                'password' => Hash::make('Eleve123!'),
                'role' => User::ROLE_STUDENT,
                'email_verified_at' => now(),
            ]
        );
    }
}
