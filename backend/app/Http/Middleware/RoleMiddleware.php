<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'غير مصرح بالدخول'], 401);
        }

        // حماية من الدور غير المعرف لتفادي 500
        $roleName = optional($user->role)->name;
        if (!$roleName) {
            return response()->json(['message' => 'لا يوجد دور محدد للمستخدم'], 403);
        }

        if (!in_array($roleName, $roles)) {
            return response()->json(['message' => 'ليس لديك صلاحية للوصول إلى هذا المورد'], 403);
        }

        return $next($request);
    }
}
