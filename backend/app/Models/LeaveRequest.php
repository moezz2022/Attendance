<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class LeaveRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'leave_type',
        'start_date',
        'end_date',
        'total_days',
        'reason',
        'status',
        'approver_id',
        'notes',
    ];

    // 🔹 تحويل الحقول إلى تواريخ
    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // 🔹 علاقة مع الموظف الذي قدم الطلب
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    // 🔹 علاقة مع الشخص الذي وافق أو رفض (من جدول users)
    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    // 🔹 حساب عدد الأيام تلقائيًا
    public function getTotalDaysAttribute()
    {
        if ($this->start_date && $this->end_date) {
            return Carbon::parse($this->start_date)->diffInDays(Carbon::parse($this->end_date)) + 1;
        }
        return 0;
    }
}
