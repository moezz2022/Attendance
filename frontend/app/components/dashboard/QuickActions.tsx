import Link from "next/link";

export default function QuickActions({ actions }: { actions: any[] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {actions.map((action, idx) => (
        <Link key={idx} href={action.href || "#"}>
          <div className={`p-4 rounded-lg text-white ${action.color} cursor-pointer hover:opacity-90`}>
            <action.icon size={24} />
            <p className="mt-2">{action.title}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
