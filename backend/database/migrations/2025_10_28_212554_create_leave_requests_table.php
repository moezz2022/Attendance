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
    Schema::create('leave_requests', function (Blueprint $table) {
        $table->id();
        $table->foreignId('employee_id')
              ->constrained('employees')
              ->cascadeOnDelete();

        // 🔹 أنواع الإجازات المطابقة للكنترولر
        $table->enum('leave_type', [
            'annual', 'sick', 'emergency', 'unpaid', 'maternity'
        ]);

        $table->date('start_date');
        $table->date('end_date');
        $table->integer('total_days');
        
        // 🔹 سبب الإجازة اختياري
        $table->text('reason')->nullable();

        // 🔹 الحالة الافتراضية: معلّقة
        $table->enum('status', ['pending', 'approved', 'rejected'])
              ->default('pending');

        // 🔹 الملاحظات التي يكتبها المدير (عند الموافقة أو الرفض)
        $table->text('notes')->nullable();

        // 🔹 المصرّح (المدير/المستخدم)
        $table->foreignId('approver_id')
              ->nullable()
              ->constrained('users')
              ->nullOnDelete();

        $table->timestamps();
    });
}



    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
