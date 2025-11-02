<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class OutsideAreaAlert extends Notification implements ShouldQueue
{
    use Queueable;

    public $user;
    public $distance;

    public function __construct($user, $distance)
    {
        $this->user = $user;
        $this->distance = $distance;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toArray($notifiable)
    {
        return [
            'title' => 'محاولة تسجيل خارج الموقع 🚨',
            'message' => "الموظف {$this->user->name} حاول التسجيل من خارج النطاق المسموح ({$this->distance} متر).",
            'user_id' => $this->user->id,
        ];
    }
}
