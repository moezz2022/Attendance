<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AttendanceChecked extends Notification implements ShouldQueue
{
    use Queueable;

    public $action;
    public $type;

    public function __construct($action, $type)
    {
        $this->action = $action;
        $this->type = $type;
    }

    public function via($notifiable)
    {
        return ['database']; // أو لاحقًا: 'mail', 'broadcast', 'fcm'
    }

    public function toArray($notifiable)
    {
        $data = [
            'title' => 'تسجيل ' . ($this->action == 'check_in' ? 'حضور' : 'انصراف'),
            'message' => "تم تسجيل {$this->action} للفترة {$this->type} بنجاح ✅",
            'type' => $this->type,
            'action' => $this->action,
            'time' => now()->format('H:i'),
        ];

        // إرسال FCM فوري مع حماية في حال عدم وجود fcm_token
        if (!empty($notifiable->fcm_token)) {
            try {
                app(\App\Services\FirebaseNotificationService::class)
                    ->sendNotification($notifiable->fcm_token, $data['title'], $data['message']);
            } catch (\Throwable $e) {
                \Log::warning('FCM send failed', ['error' => $e->getMessage()]);
            }
        }

        return $data;
    }
}
