<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class Employee extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'datnais',
        'matri',
        'fonc',
        'department_id',
        'fingerprint_hash',
        'device_id',
        'status',
    ];

    protected $casts = [
        'datnais' => 'date',
    ];

      public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    // العلاقات
    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class, 'employee_id');
    }

      public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class, 'employee_id', 'id');
    }


}