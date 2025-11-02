<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        // يمكن تعديلها لاحقًا للتحقق من صلاحيات المستخدم
        return true;
    }

    public function rules(): array
    {
        return [
            'leave_type' => 'required|in:annual,emergency,sick',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'total_days' => 'nullable|integer|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'leave_type.required' => 'نوع الإجازة مطلوب.',
            'start_date.required' => 'تاريخ بداية الإجازة مطلوب.',
            'end_date.required'   => 'تاريخ نهاية الإجازة مطلوبة.',
            'end_date.after_or_equal' => 'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية.',
        ];
    }
}
