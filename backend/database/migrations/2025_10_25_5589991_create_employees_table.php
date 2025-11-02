<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEmployeesTable extends Migration
{

    public function up()
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name', 20);
            $table->date('datnais');
            $table->string('matri', 20)->unique();
            $table->string('fonc', 100)->nullable();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('fingerprint_hash')->nullable();
            $table->string('device_id')->nullable();
            $table->string('status', 20)->nullable();
            $table->timestamps();

        });
    }


    public function down()
    {
        Schema::dropIfExists('employees');
    }
}