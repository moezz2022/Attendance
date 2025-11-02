<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    /**
     * عرض كل الأقسام مع المدير والموظفين
     */
    public function index()
    {
        $departments = Department::with(['manager', 'employees'])->get();
        return response()->json($departments);
    }

    /**
     * إنشاء قسم جديد
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $department = Department::create($validated);
        $department->load(['manager', 'employees']);

        return response()->json([
            'message' => 'تم إنشاء القسم بنجاح',
            'department' => $department,
        ], 201);
    }

    /**
     * عرض قسم محدد
     */
    public function show(Department $department)
    {
        $department->load(['manager', 'employees']);
        return response()->json($department);
    }

    /**
     * تحديث قسم
     */
    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $department->update($validated);
        $department->load(['manager', 'employees']);

        return response()->json([
            'message' => 'تم تحديث القسم بنجاح',
            'department' => $department,
        ]);
    }

    /**
     * حذف قسم
     */
    public function destroy(Department $department)
    {
        if ($department->employees()->exists()) {
            return response()->json([
                'message' => 'لا يمكن حذف القسم لوجود موظفين مرتبطين به'
            ], 400);
        }

        $department->delete();

        return response()->json(['message' => 'تم حذف القسم بنجاح']);
    }

    /**
     * تعيين موظفين لقسم معين
     */
    public function assignEmployees(Request $request, Department $department)
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'exists:employees,id',
        ]);

        // تحديث الموظفين لإسنادهم إلى هذا القسم
        Employee::whereIn('id', $validated['employee_ids'])
            ->update(['department_id' => $department->id]);

        $department->load('employees');

        return response()->json([
            'message' => 'تم تعيين الموظفين لهذا القسم بنجاح',
            'department' => $department
        ]);
    }
    public function departmentsStats()
    {
        $departments = Department::withCount('employees')->get();

        $data = $departments->map(function ($dept) {
            return [
                'name' => $dept->name,
                'value' => $dept->employees_count,
            ];
        });

        return response()->json(['departments' => $data]);
    }
}
