<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CompanySetting;

class CompanySettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'name' => 'مديرية التربية لولاية المغير',
                'latitude' => 52.0814592,          // خط العرض التقريبي
                'longitude' => 4.3057152,          // خط الطول التقريبي
                'allowed_radius_meters' => 200,   // نصف قطر السماح بالتسجيل بالحضور (مثلاً 100 متر)
            ],
        ];

        CompanySetting::insert($settings);
    }
}
