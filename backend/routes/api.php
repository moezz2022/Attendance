<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\DepartmentController;


Route::post('/employee/login', [EmployeeController::class, 'login']);
Route::post('/employee/attendance', [AttendanceController::class, 'recordAttendance']);
Route::get('/employees', [EmployeeController::class, 'index']);
Route::post('/employees', [EmployeeController::class, 'store']);
Route::put('/employees/{id}', [EmployeeController::class, 'update']);
Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);
Route::post('/employees/import', [EmployeeController::class, 'import']);

// 🔐 المصادقة
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
Route::get('/users', [AuthController::class, 'index']);
// 🧩 محمية بالتوكن
Route::middleware(['auth:sanctum'])->group(function () {

    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // 🧑‍💼 للمدير فقط
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/admin/dashboard', function () {
            return response()->json(['message' => 'لوحة تحكم المدير']);
        });
    });
});


Route::middleware(['auth:sanctum'])->group(function () {
    // للجميع
    Route::post('/attendance/record', [AttendanceController::class, 'recordAttendance']);
    Route::get('/dashboard/stats', [AttendanceController::class, 'dashboardStats']);
    Route::get('/attendance/report', [AttendanceController::class, 'getEmployeeAttendance']);
    Route::get('/attendance/all', [AttendanceController::class, 'allAttendance']);

});


Route::middleware(['auth:sanctum', 'role:admin|manager'])->group(function () {
    Route::get('/company-setting', [CompanySettingController::class, 'show']);
    Route::post('/company-setting', [CompanySettingController::class, 'update']);
});

Route::post('/update-fcm-token', function (\Illuminate\Http\Request $request) {
    $request->validate(['token' => 'required|string']);
    $user = $request->user();
    $user->update(['fcm_token' => $request->token]);

    return response()->json(['message' => 'تم تحديث رمز الإشعارات بنجاح ✅']);
})->middleware('auth:sanctum');

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/{id}', [NotificationController::class, 'show']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
});

Route::middleware(['auth:sanctum'])->group(function () {

    /**
     * 👨‍💼 مسارات المدير (الإدارة)
     */
    Route::middleware(['role:admin'])->prefix('admin')->group(function () {
        Route::get('/leave/requests', [LeaveRequestController::class, 'index']); // عرض كل الطلبات
        Route::get('/leave/requests/{id}', [LeaveRequestController::class, 'show']); // تفاصيل الطلب
        Route::put('/leave/requests/{id}/approve', [LeaveRequestController::class, 'approve']); // الموافقة
        Route::put('/leave/requests/{id}/reject', [LeaveRequestController::class, 'reject']);   // الرفض
        Route::delete('/leave/requests/{id}', [LeaveRequestController::class, 'destroy']);      // الحذف (في حال الضرورة)
        Route::get('/leave/statistics', [LeaveRequestController::class, 'statistics']);         // الإحصائيات
        Route::get('/leaves/today', [LeaveRequestController::class, 'todayOnLeave']);
    });
});

/**
 * 👷‍♂️ مسارات الموظف (المستخدم العادي)
 */
Route::post('/leave/requests', [LeaveRequestController::class, 'store']);        // إنشاء طلب
Route::get('/leave/my-requests', [LeaveRequestController::class, 'myRequests']); // طلبات الموظف
Route::get('/leave/requests/{id}', [LeaveRequestController::class, 'show']);     // تفاصيل طلبه الشخصي
Route::delete('/leave/requests/{id}', [LeaveRequestController::class, 'destroy']); // حذف الطلب (إذا لم يُعتمد)



Route::get('/departments/stats', [DepartmentController::class, 'departmentsStats']);
Route::apiResource('departments', DepartmentController::class);
Route::post('/departments/{department}/assign-employees', [DepartmentController::class, 'assignEmployees']);
