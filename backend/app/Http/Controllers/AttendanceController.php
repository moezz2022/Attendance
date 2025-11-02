<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\AttendanceRecord;
use App\Models\LeaveRequest;
use App\Models\CompanySetting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{

    /**
     * 📝 تسجيل الحضور والانصراف
     */
    public function recordAttendance(Request $request)
    {
        try {
            // 🔍 التحقق من صحة البيانات المدخلة
            $request->validate([
                'matri' => 'required|string',
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'type' => 'nullable|in:morning,evening',
                'action' => 'nullable|in:check_in,check_out',
                'date' => 'nullable|date',
            ]);

            $today = $request->input('date') ?? now()->toDateString();
            $now = now();

            // 🧩 جلب الموظف
            $employee = Employee::where('matri', $request->matri)->first();
            if (!$employee) {
                return response()->json([
                    'status' => 'error',
                    'message' => '🚫 الموظف غير موجود.'
                ], 404);
            }

            // 🔍 التحقق من حالة الموظف
            if ($employee->status !== 'active') {
                return response()->json([
                    'status' => 'error',
                    'message' => '🚫 حساب الموظف غير نشط.'
                ], 403);
            }

            // 🏖️ التحقق من الإجازات
            $onLeave = LeaveRequest::where('employee_id', $employee->id)
                ->where('status', 'approved')
                ->whereDate('start_date', '<=', $today)
                ->whereDate('end_date', '>=', $today)
                ->exists();

            if ($onLeave) {
                return response()->json([
                    'status' => 'error',
                    'message' => '🏖️ الموظف في إجازة مُعتمدة اليوم.'
                ], 400);
            }

            // ⚙️ إعدادات الشركة مع التخزين المؤقت
            $setting = Cache::remember('company_setting', 3600, fn() => CompanySetting::first());
            if (!$setting) {
                return response()->json([
                    'status' => 'error',
                    'message' => '⚙️ إعدادات الشركة غير مضبوطة.'
                ], 500);
            }

            // 📍 التحقق من الموقع الجغرافي
            $distance = $this->calculateDistance(
                $setting->latitude,
                $setting->longitude,
                $request->latitude,
                $request->longitude
            );

            if ($distance > $setting->allowed_radius_meters) {
                Log::channel('attendance')->warning('Outside company radius', [
                    'employee_id' => $employee->id,
                    'distance' => round($distance, 2),
                    'allowed' => $setting->allowed_radius_meters,
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => "🚫 أنت خارج نطاق الشركة (المسافة: " . round($distance) . "م)."
                ], 403);
            }

            // 🔒 استخدام Transaction للأمان
            DB::beginTransaction();

            try {
                // ⏰ جلب أو إنشاء سجل الحضور مع قفل للحماية من Race Conditions
                $record = AttendanceRecord::where([
                    'employee_id' => $employee->id,
                    'date' => $today,
                ])->lockForUpdate()->first();

                $isNewRecord = false;

                // إذا لم يكن هناك سجل، أنشئ واحدًا جديدًا
                if (!$record) {
                    $record = new AttendanceRecord([
                        'employee_id' => $employee->id,
                        'date' => $today,
                        'status' => 'absent', // الحالة الافتراضية
                    ]);
                    $isNewRecord = true;
                }

                $requestedPeriod = $request->input('type');
                $period = $requestedPeriod ?? $this->getShift($now, $record, $isNewRecord);
                $action = $request->input('action') ?? 'check_in';

                $actionLabels = [
                    'check_in' => 'تسجيل دخول',
                    'check_out' => 'تسجيل خروج',
                ];

                $periodLabels = [
                    'morning' => 'الفترة الصباحية',
                    'evening' => 'الفترة المسائية',
                ];

                $actionLabel = $actionLabels[$action] ?? $action;
                $periodLabel = $periodLabels[$period] ?? $period;

                // التحقق من أن الوقت مناسب لتسجيل الدخول
                if ($action === 'check_in' && !$this->isWithinShiftTime($now, $period)) {
                    DB::rollBack();
                    return response()->json([
                        'status' => 'error',
                        'message' => "⏳ لا يمكن تسجيل الدخول للفترة {$periodLabel} في هذا الوقت.",
                    ], 400);
                }

                // التحقق من أن الوقت ليس خارج فترات العمل
                if ($period === 'out_of_shift') {
                    DB::rollBack();

                    $shifts = config('attendance.shifts');
                    $message = '⏳ الوقت الحالي خارج فترات العمل المحددة. ';
                    $message .= 'أوقات العمل: الصباحية (' . $shifts['morning']['start'] . ' - ' . $shifts['morning']['end'] . ')، ';
                    $message .= 'المسائية (' . $shifts['evening']['start'] . ' - ' . $shifts['evening']['end'] . ')';

                    return response()->json([
                        'status' => 'error',
                        'message' => $message,
                    ], 400);
                }

                $columnTime = "{$action}_{$period}";
                $columnLat = "{$action}_{$period}_lat";
                $columnLng = "{$action}_{$period}_lng";

                // 🚫 منع التكرار - التحقق من وجود تسجيل مسبق
                if (!empty($record->$columnTime)) {
                    try {
                        // التحقق من التسجيل المزدوج في نفس الدقيقة
                        $lastTime = Carbon::parse($record->$columnTime);
                        if ($now->diffInMinutes($lastTime) < 1) {
                            DB::rollBack();
                            return response()->json([
                                'status' => 'error',
                                'message' => '🚫 تم التسجيل مؤخرًا، يرجى الانتظار دقيقة.',
                            ], 429);
                        }
                    } catch (\Exception $e) {
                        Log::warning('Invalid time format in attendance record', [
                            'record_id' => $record->id,
                            'column' => $columnTime,
                            'value' => $record->$columnTime
                        ]);
                    }

                    // إذا كان التسجيل موجودًا بالفعل (ليس في نفس الدقيقة)
                    DB::rollBack();
                    return response()->json([
                        'status' => 'error',
                        'message' => "🚫 تم {$actionLabel} للفترة {$periodLabel} مسبقًا.",
                    ], 400);
                }

                // 💾 حفظ الوقت والموقع أولاً
                $record->fill([
                    $columnTime => $now->format('H:i:s'),
                    $columnLat => $request->latitude,
                    $columnLng => $request->longitude,
                ]);

                // 🎯 تحديد الحالة (سيتم تحديث $record داخل الدالة)
                $periodStatus = $this->determineStatus($now, $period, $action, $record);

                // 💾 حفظ السجل
                $record->save();

                // 🕒 حساب ساعات العمل
                $workHours = $this->calculateWorkHours($record);
                $record->work_hours = $workHours;
                $record->save();

                // إتمام العملية
                DB::commit();

                // 📊 تسجيل الحدث
                Log::channel('attendance')->info('Attendance recorded successfully', [
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->name,
                    'action' => $action,
                    'period' => $period,
                    'period_status' => $periodStatus,
                    'daily_status' => $record->status,
                    'distance' => round($distance, 2),
                    'time' => $now->format('H:i:s'),
                    'date' => $today,
                ]);

                // ✅ رسالة النجاح النهائية
                return response()->json([
                    'status' => 'success',
                    'message' => "✅ تم {$actionLabel} بنجاح لـ {$periodLabel}.",
                    'time' => $now->format('H:i:s'),
                    'date' => $today,
                    'period_status' => $periodStatus,
                    'daily_status' => $record->status,
                    'work_hours' => $workHours,
                    'employee' => [
                        'id' => $employee->id,
                        'name' => $employee->name,
                        'matri' => $employee->matri,
                    ],
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => '⚠️ خطأ في البيانات المدخلة',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::channel('attendance')->error('Attendance record error', [
                'employee' => $request->matri ?? 'unknown',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء المعالجة',
                'error_detail' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 🔒 التحقق من أن الوقت الحالي داخل الفترة المسموح بها مع هامش سماح
     */
    private function isWithinShiftTime(Carbon $time, string $period): bool
    {
        $shifts = config('attendance.shifts');
        $grace = config('attendance.grace_period_minutes', 15);

        if (!isset($shifts[$period])) {
            return false;
        }

        $start = Carbon::createFromFormat('H:i', $shifts[$period]['start'])->subMinutes($grace);
        $end = Carbon::createFromFormat('H:i', $shifts[$period]['end'])->addMinutes($grace);

        return $time->between($start, $end);
    }

    /**
     * 🎯 تحديد حالة الموظف (حاضر / متأخر / خرج مبكرًا)
     * ملاحظة: هذه الدالة تُعدل $record مباشرة
     */
    private function determineStatus(Carbon $now, string $period, string $action, AttendanceRecord $record): string
    {
        $shifts = config('attendance.shifts');

        // الحالة الافتراضية
        $status = 'present';
        $column = "status_{$period}";

        // تسجيل دخول الفترة الصباحية أو المسائية
        if ($action === 'check_in') {
            $limit = Carbon::createFromTimeString($shifts[$period]['late_after']);
            $status = $now->gt($limit) ? 'late' : 'present';
        }

        // تسجيل خروج الفترة الصباحية أو المسائية
        if ($action === 'check_out') {
            $limit = Carbon::createFromTimeString($shifts[$period]['early_leave_before']);
            if ($now->lt($limit)) {
                $status = 'left_early';
           } else {
                // نحافظ على الحالة السابقة (مثلاً لو تأخر صباحًا)
                $status = $record->$column ?? 'present';
            }
        }

        // تحديث الحالة الخاصة بالفترة
        $record->$column = $status;

        // تحديث الحالة اليومية العامة بناءً على الفترتين
        $record->status = $this->summarizeDailyStatus($record);

        return $status;
    }

    /**
     * 🧩 حساب الحالة اليومية بناءً على الفترتين
     */
    private function summarizeDailyStatus(AttendanceRecord $record): string
    {
        $morning = $record->status_morning;
        $evening = $record->status_evening;

        // إذا لم يحضر أي فترة
        if (!$morning && !$evening) {
            return 'absent';
        }

        // إذا كان في إجازة
        if ($record->is_on_leave ?? false) {
            return 'leave';
        }

        // إذا تأخر في أي فترة
        if ($morning === 'late' || $evening === 'late') {
            return 'late';
        }

        // إذا خرج مبكرًا في أي فترة
        if ($morning === 'left_early' || $evening === 'left_early') {
            return 'left_early';
        }

        // إذا حضر في كلتا الفترتين بانتظام
        return 'present';
    }


    /**
     * ⌛ حساب إجمالي ساعات العمل في اليوم
     */
    private function calculateWorkHours(AttendanceRecord $record): float
    {
        $total = 0;

        // حساب ساعات الفترة الصباحية
        if ($record->check_in_morning && $record->check_out_morning) {
            try {
                $total += Carbon::parse($record->check_in_morning)
                    ->diffInMinutes(Carbon::parse($record->check_out_morning));
            } catch (\Exception $e) {
                Log::warning('Error calculating morning hours', [
                    'record_id' => $record->id,
                    'check_in' => $record->check_in_morning,
                    'check_out' => $record->check_out_morning,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // حساب ساعات الفترة المسائية
        if ($record->check_in_evening && $record->check_out_evening) {
            try {
                $total += Carbon::parse($record->check_in_evening)
                    ->diffInMinutes(Carbon::parse($record->check_out_evening));
            } catch (\Exception $e) {
                Log::warning('Error calculating evening hours', [
                    'record_id' => $record->id,
                    'check_in' => $record->check_in_evening,
                    'check_out' => $record->check_out_evening,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return round($total / 60, 2);
    }

    /**
     * 🕐 تحديد الفترة الزمنية (صباحية أو مسائية) بناءً على الوقت الحالي
     */
    private function getShift(Carbon $time, AttendanceRecord $attendance = null, bool $isNewRecord = false): string
    {
        $shifts = config('attendance.shifts');
        $grace = config('attendance.grace_period_minutes', 15);

        // التحقق من الفترات المحددة أولاً
        $morningStart = Carbon::createFromFormat('H:i', $shifts['morning']['start'])->subMinutes($grace);
        $morningEnd = Carbon::createFromFormat('H:i', $shifts['morning']['end'])->addMinutes($grace);
        $eveningStart = Carbon::createFromFormat('H:i', $shifts['evening']['start'])->subMinutes($grace);
        $eveningEnd = Carbon::createFromFormat('H:i', $shifts['evening']['end'])->addMinutes($grace);

        // إذا كان في نطاق الوقت
        if ($time->between($morningStart, $morningEnd)) {
            return 'morning';
        }
        if ($time->between($eveningStart, $eveningEnd)) {
            return 'evening';
        }

        // التحقق من السجلات الموجودة (للسماح بالخروج خارج الوقت)
        if ($isNewRecord) {
            return 'out_of_shift';
        }

        if ($attendance) {
            // إذا سجل دخول صباحي ولم يسجل خروج
            if ($attendance->check_in_morning && !$attendance->check_out_morning) {
                return 'morning';
            }
            // إذا سجل دخول مسائي ولم يسجل خروج
            if ($attendance->check_in_evening && !$attendance->check_out_evening) {
                return 'evening';
            }
        }

        return 'out_of_shift';
    }

    /**
     * 🧮 حساب المسافة بين نقطتين (Haversine formula)
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371000; // نصف قطر الأرض بالأمتار

        $lat1 = deg2rad($lat1);
        $lon1 = deg2rad($lon1);
        $lat2 = deg2rad($lat2);
        $lon2 = deg2rad($lon2);

        $deltaLat = $lat2 - $lat1;
        $deltaLon = $lon2 - $lon1;

        $a = sin($deltaLat / 2) ** 2 + cos($lat1) * cos($lat2) * sin($deltaLon / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    public function getEmployeeAttendance(Request $request)
    {
        $request->validate([
            'matri' => 'required',
            'from' => 'required|date',
            'to' => 'required|date',
        ]);

        // البحث عن الموظف مع القسم
        $employee = Employee::with('department')
            ->where('matri', $request->matri)
            ->orWhere('id', $request->matri)
            ->first();

        if (!$employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'الموظف غير موجود'
            ], 404);
        }

        // جلب سجلات الحضور
        $records = AttendanceRecord::where('employee_id', $employee->id)
            ->whereBetween('date', [$request->from, $request->to])
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'date' => $record->date,
                    'check_in_morning' => $record->check_in_morning,
                    'check_out_morning' => $record->check_out_morning,
                    'check_in_evening' => $record->check_in_evening,
                    'check_out_evening' => $record->check_out_evening,
                    'status_morning' => $record->status_morning,
                    'status_evening' => $record->status_evening,
                    'work_hours' => $record->work_hours ?? 0,
                    'status' => $record->status ?? 'present',
                    'notes' => $record->notes,
                ];
            });

        return response()->json([
            'status' => 'success',
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'matri' => $employee->matri,
                'department' => $employee->department ? $employee->department->name : 'قسم غير محدد',
                'position' => $employee->fonc ?? 'موظف',
            ],
            'records' => $records
        ]);
    }


 public function allAttendance()
{
    $records = AttendanceRecord::with('employee:id,name,matri')
        ->orderByDesc('date')
        ->orderByDesc('created_at')
        ->get()
        ->map(function ($record) {
            $record->date = \Carbon\Carbon::parse($record->date)
                ->setTimezone('Africa/Algiers')
                ->format('Y-m-d');
            $record->created_at = $record->created_at
                ? $record->created_at->setTimezone('Africa/Algiers')->format('Y-m-d H:i:s')
                : null;
            return $record;
        });

    return response()->json($records);
}


    public function dashboardStats()
    {
        $today = now()->toDateString();
        $shifts = config('attendance.shifts', [
            'morning' => ['late_after' => '08:30'],
            'evening' => ['late_after' => '13:30'],
        ]);

        // عدد الموظفين النشطين
        $totalEmployees = Employee::where('status', 'active')->count();

        // عدد الحاضرين اليوم (صباح أو مساء)
        $presentToday = AttendanceRecord::whereDate('date', $today)
            ->where(function ($q) {
                $q->whereNotNull('check_in_morning')
                    ->orWhereNotNull('check_in_evening');
            })
            ->distinct('employee_id')
            ->count('employee_id');

        // عدد المتأخرين اليوم (بناءً على status_morning أو status_evening)
        $lateToday = AttendanceRecord::whereDate('date', $today)
            ->where(function ($q) {
                $q->where('status_morning', 'late')
                    ->orWhere('status_evening', 'late')
                    ->orWhere('status', 'late');
            })
            ->distinct('employee_id')
            ->count('employee_id');

        // عدد الموظفين في إجازة اليوم
        $onLeaveToday = LeaveRequest::whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->where('status', 'approved')
            ->distinct('employee_id')
            ->count('employee_id');

        // عدد الغائبين = إجمالي الموظفين - الحاضرين - المجازين
        $absentToday = max(0, $totalEmployees - $presentToday - $onLeaveToday);

        return response()->json([
            'total_employees' => $totalEmployees,
            'present_today' => $presentToday,
            'late_today' => $lateToday,
            'leave_today' => $onLeaveToday,
            'absent_today' => $absentToday,
            'date' => $today,
        ]);
    }

}