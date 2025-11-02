<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
 public function up(): void
{
    Schema::create('settings', function (Blueprint $table) {
        $table->id();
        $table->time('work_start_time')->default('08:00:00');
        $table->time('work_end_time')->default('16:00:00');
        $table->decimal('location_lat', 10, 7)->nullable();
        $table->decimal('location_lng', 10, 7)->nullable();
        $table->integer('allowed_radius_m')->default(100);
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
