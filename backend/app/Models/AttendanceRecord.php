<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class AttendanceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date',

        // الفترة الصباحية
        'check_in_morning',
        'check_out_morning',
        'check_in_morning_lat',
        'check_in_morning_lng',
        'check_out_morning_lat',
        'check_out_morning_lng',
        'status_morning',

        // الفترة المسائية
        'check_in_evening',
        'check_out_evening',
        'check_in_evening_lat',
        'check_in_evening_lng',
        'check_out_evening_lat',
        'check_out_evening_lng',
        'status_evening',

        'status',
        'work_hours',
        'is_on_leave',
        'notes',
    ];
 
    protected $casts = [
        'date' => 'date',
        'check_in_morning' => 'datetime:H:i:s',
        'check_out_morning' => 'datetime:H:i:s',
        'check_in_evening' => 'datetime:H:i:s',
        'check_out_evening' => 'datetime:H:i:s',
        'work_hours' => 'decimal:2',
        'is_on_leave' => 'boolean',
    ];

    protected $attributes = [
        'status' => 'present',
        'notes' => '',
    ];

    // 🔗 العلاقة مع الموظف
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }



    // 💬 تنسيق الحالة كنص عربي واضح
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'late' => 'متأخر',
            'left_early' => 'انصرف مبكرًا',
            'absent' => 'غائب',
            default => 'حاضر',
        };
    }
}
