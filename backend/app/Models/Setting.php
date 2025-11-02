<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'work_start_time', 'work_end_time', 'location_lat', 'location_lng', 'allowed_radius_m'
    ];
}
