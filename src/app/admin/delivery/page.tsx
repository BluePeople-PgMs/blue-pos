"use client";

import { AdminDeliveryOpsView } from "@/components/delivery/admin/AdminDeliveryOpsView";
import { RequiereSesion } from "@/components/RequiereSesion";

export default function AdminDeliveryPage() {
  return (
    <main className="app-main">
      <RequiereSesion>
        {() => <AdminDeliveryOpsView />}
      </RequiereSesion>
    </main>
  );
}