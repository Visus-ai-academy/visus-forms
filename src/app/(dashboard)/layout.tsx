import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { MobileHeader } from "@/components/dashboard/mobile-header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface">
      <MobileHeader />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
