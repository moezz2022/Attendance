<?php

namespace App\Imports;

use App\Models\Employee;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class EmployeesImport implements ToModel, WithHeadingRow, SkipsOnError
{
    use SkipsErrors;

    public function model(array $row)
    {
        try {
            // تحويل المفاتيح لحروف صغيرة
            $row = array_change_key_case($row, CASE_LOWER);

            // إزالة المسافات من أسماء الأعمدة
            $cleanRow = [];
            foreach ($row as $key => $value) {
                $cleanKey = trim(str_replace(' ', '', $key)); // لا نحذف "_" فقط المسافات
                $cleanRow[$cleanKey] = $value;
            }

            // تحقق من البيانات المطلوبة
            if (empty($cleanRow['matri'])) {
                Log::warning("⚠️ تم تخطي سطر: matri فارغ", ['row' => $cleanRow]);
                return null;
            }

            return new Employee([
                'matri' => trim($cleanRow['matri']),
                'name' => trim($cleanRow['name'] ?? ''),
                'datnais' => $this->parseDate($cleanRow['datnais'] ?? null),
                'fonc' => $cleanRow['fonc'] ?? null,
                'department_id' => isset($cleanRow['department_id']) ? trim($cleanRow['department_id']) : null,
                'status' => $cleanRow['status'] ?? 'active',
            ]);
        } catch (\Exception $e) {
            Log::error('❌ خطأ في الاستيراد: ' . $e->getMessage(), ['row' => $row]);
            return null;
        }
    }

    private function parseDate($date)
    {
        if (empty($date)) {
            return '1970-01-01';
        }

        if (is_numeric($date)) {
            return Date::excelToDateTimeObject(floatval($date))->format('Y-m-d');
        }

        try {
            return date('Y-m-d', strtotime($date));
        } catch (\Exception $e) {
            return '1970-01-01';
        }
    }
}