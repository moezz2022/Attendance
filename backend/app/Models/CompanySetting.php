<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'latitude',
        'longitude',
        'allowed_radius_meters',
    ];

     protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'allowed_radius_meters' => 'integer',
    ];
}
