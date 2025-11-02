<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->date('date');
            
            // Morning shift
            $table->time('check_in_morning')->nullable();
            $table->decimal('check_in_morning_lat', 10, 8)->nullable();
            $table->decimal('check_in_morning_lng', 11, 8)->nullable();
            $table->time('check_out_morning')->nullable();
            $table->decimal('check_out_morning_lat', 10, 8)->nullable();
            $table->decimal('check_out_morning_lng', 11, 8)->nullable();
            $table->string('status_morning')->nullable();
            
            // Evening shift
            $table->time('check_in_evening')->nullable();
            $table->decimal('check_in_evening_lat', 10, 8)->nullable();
            $table->decimal('check_in_evening_lng', 11, 8)->nullable();
            $table->time('check_out_evening')->nullable();
            $table->decimal('check_out_evening_lat', 10, 8)->nullable();
            $table->decimal('check_out_evening_lng', 11, 8)->nullable();
            $table->string('status_evening')->nullable();
            
            // General
            $table->string('status')->default('present');
            $table->decimal('work_hours', 5, 2)->default(0);
            $table->boolean('is_on_leave')->default(false);
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            $table->unique(['employee_id', 'date']);
            $table->index(['date', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('attendance_records');
    }
};