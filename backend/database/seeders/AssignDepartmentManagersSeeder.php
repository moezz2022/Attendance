<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class AssignDepartmentManagersSeeder extends Seeder
{
    public function run(): void
    {
        $departments = Department::all();

        foreach ($departments as $department) {
            $department->update(['manager_id' => $department->id]);
        }
    }
}
