"use client";

/* 🧑‍💼 الرأس */
export default function Header({ user, time, formatTime, formatDate }: any) {
  return (
    <header className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">مرحباً، {user.name}</h1>
      </div>
      <div className="text-left">
        <div className="text-4xl font-bold text-blue-600 font-mono">{formatTime(time)}</div>
         <p className="text-gray-500">{formatDate(time)}</p>
      </div>
    </header>
  );
}