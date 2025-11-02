<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'department_id',
        'fingerprint_hash',
        'device_id',
        'status'
    ];

    protected $hidden = ['password'];

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }


    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }
    public function approvedRequests()
    {
        return $this->hasMany(LeaveRequest::class, 'approver_id');
    }
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
