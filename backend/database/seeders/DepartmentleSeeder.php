<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentleSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'الامانة الخاصة', 'manager_id' => null],
            ['name' => 'الامانة العامة', 'manager_id' => null],
            ['name' => 'مصلحة المستخدمين والتفتيش', 'manager_id' => null],
            ['name' => 'مصلحة التمدرس والامتحانات', 'manager_id' => null],
            ['name' => 'مصلحة البرمجة والمتابعة', 'manager_id' => null],
            ['name' => 'مصلحة تسيير نفقات المستخدمين', 'manager_id' => null],
        ];

        Department::insert($departments);
    }
}
 
