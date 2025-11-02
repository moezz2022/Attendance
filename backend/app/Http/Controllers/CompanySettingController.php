<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use Illuminate\Http\Request;

class CompanySettingController extends Controller
{
    // 🔍 عرض الإعداد الحالي
    public function show()
    {
        $setting = CompanySetting::first();

        if (!$setting) {
            return response()->json(['message' => 'لم يتم إعداد موقع الشركة بعد.'], 404);
        }

        return response()->json($setting);
    }

    // ✏️ تحديث الإعداد أو إنشاؤه
    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'allowed_radius_meters' => 'required|integer|min:10|max:1000',
        ]);

        $setting = CompanySetting::first();

        if ($setting) {
            $setting->update($validated);
        } else {
            $setting = CompanySetting::create($validated);
        }

        return response()->json([
            'message' => 'تم تحديث إعدادات الشركة بنجاح ✅',
            'data' => $setting
        ]);
    }
}
