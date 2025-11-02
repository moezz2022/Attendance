<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'مدير الأمانة الخاصة',
                'email' => 'manager1@example.com',
                'password' => Hash::make('password123'),
                'role_id' => 1,
                'department_id' => 1,
                'fingerprint_hash' => null,
                'device_id' => null,
                'status' => 1, // بدل 'active'
            ],
            [
                'name' => 'مدير الأمانة العامة',
                'email' => 'manager2@example.com',
                'password' => Hash::make('password123'),
                'role_id' => 1,
                'department_id' => 2,
                'fingerprint_hash' => null,
                'device_id' => null,
                'status' => 1,
            ],
            [
                'name' => 'رئيس مصلحة المستخدمين والتفتيش',
                'email' => 'manager3@example.com',
                'password' => Hash::make('password123'),
                'role_id' => 1,
                'department_id' => 3,
                'fingerprint_hash' => null,
                'device_id' => null,
                'status' => 1,
            ],
            [
                'name' => 'رئيس مصلحة التمدرس والامتحانات',
                'email' => 'manager4@example.com',
                'password' => Hash::make('password123'),
                'role_id' => 1,
                'department_id' => 4,
                'fingerprint_hash' => null,
                'device_id' => null,
                'status' => 1,
            ],
            [
                'name' => 'رئيس مصلحة البرمجة والمتابعة',
                'email' => 'manager5@example.com',
                'password' => Hash::make('password123'),
                'role_id' => 1,
                'department_id' => 5,
                'fingerprint_hash' => null,
                'device_id' => null,
                'status' => 1,
            ],
            [
                'name' => 'رئيس مصلحة تسيير نفقات المستخدمين',
                'email' => 'manager6@example.com',
                'password' => Hash::make('password123'),
                'role_id' => 1,
                'department_id' => 6,
                'fingerprint_hash' => null,
                'device_id' => null,
                'status' => 1,
            ],
        ];

        User::insert($users);
    }
}
