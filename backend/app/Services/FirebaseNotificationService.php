<?php

namespace App\Services;

use Kreait\Firebase\Factory;

class FirebaseNotificationService
{
    protected $messaging;

    public function __construct()
    {
        $this->messaging = (new Factory)
            ->withServiceAccount(config('app.firebase_credentials', base_path(env('FIREBASE_CREDENTIALS'))))
            ->createMessaging();
    }

    public function sendNotification($token, $title, $body)
    {
        if (!$token) return false;

        $message = [
            'token' => $token,
            'notification' => [
                'title' => $title,
                'body' => $body,
            ],
        ];

        try {
            $this->messaging->send($message);
            return true;
        } catch (\Exception $e) {
            \Log::error('FCM Error: ' . $e->getMessage());
            return false;
        }
    }
}
