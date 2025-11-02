<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\EmployeesImport;
use App\Models\Department;
class EmployeeController extends Controller
{


    public function login(Request $request)
    {
        $employee = Employee::where('matri', $request->matri)->first();

        if (!$employee) {
            return response()->json(['message' => 'رمز الموظف غير صحيح'], 401);
        }

        return response()->json(['employee' => $employee]);
    }

    public function index()
    {
        $employees = Employee::all();
        $employees = Employee::with('department')->get();
        return response()->json($employees);
    }

public function store(Request $request)
{
    $data = $request->validate([
        'name' => 'required|string|max:20',
        'matri' => 'required|string|max:20|unique:employees,matri',
        'fonc' => 'required|string|max:100',
        'department_id' => 'required|integer',
        'status' => 'nullable|string|max:20',
    ]);

    try {
        $employee = Employee::create($data);

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة الموظف بنجاح ✅',
            'employee' => $employee,
        ], 201);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => '❌ حدث خطأ أثناء إضافة الموظف. تأكد من صحة البيانات.',
            'error' => $e->getMessage(), // لإظهار سبب الخطأ الفعلي
        ], 500);
    }
}



    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);

        // إذا أرسل الاسم بدل الـ id
        if (!is_numeric($request->department_id)) {
            $department = Department::where('name', $request->department_id)->first();

            if ($department) {
                $request->merge(['department_id' => $department->id]);
            } else {
                return response()->json(['message' => 'القسم غير موجود'], 404);
            }
        }

        $employee->update([
            'name' => $request->name,
            'datnais' => $request->datnais,
            'matri' => $request->matri,
            'fonc' => $request->fonc,
            'department_id' => $request->department_id,
            'status' => $request->status,
        ]);

        return response()->json(['message' => 'تم تحديث الموظف بنجاح']);
    }



    public function destroy($id)
    {
        $employees = Employee::findOrFail($id);
        $employees->delete();
        return response()->json($employees);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv'
        ]);

        try {
            $file = $request->file('file');

            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            DB::table('employees')->truncate();
            Excel::import(new EmployeesImport, $file);
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            return response()->json([
                'success' => true,
                'message' => 'تم استيراد البيانات بنجاح',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل استيراد البيانات: ' . $e->getMessage(),
            ], 500);
        }
    }
}
