<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // 📋 عرض جميع الإشعارات (مع إمكانية الفلترة)
    public function index(Request $request)
    {
        $user = $request->user();

        // صلاحية المدير أو الأدمن: رؤية كل الإشعارات
        if ($user->role->name === 'admin' || $user->role->name === 'manager') {
            $notifications = \DB::table('notifications')
                ->orderByDesc('created_at')
                ->paginate(20);
        } else {
            // الموظف يشاهد إشعاراته فقط
            $notifications = $user->notifications()->orderByDesc('created_at')->paginate(20);
        }

        return response()->json($notifications);
    }

    // 👁️ عرض تفاصيل إشعار واحد
    public function show($id)
    {
        $notification = \DB::table('notifications')->find($id);

        if (!$notification) {
            return response()->json(['message' => 'الإشعار غير موجود'], 404);
        }

        return response()->json($notification);
    }

    // 🧹 تعليم إشعار كمقروء
    public function markAsRead($id)
    {
        $notification = auth()->user()->notifications()->find($id);

        if (!$notification) {
            return response()->json(['message' => 'الإشعار غير موجود أو لا يخص هذا المستخدم'], 404);
        }

        $notification->markAsRead();

        return response()->json(['message' => 'تم تعليم الإشعار كمقروء ✅']);
    }

    // 🧼 تعليم الكل كمقروء
    public function markAllAsRead()
    {
        auth()->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'تم تعليم جميع الإشعارات كمقروءة ✅']);
    }
}
