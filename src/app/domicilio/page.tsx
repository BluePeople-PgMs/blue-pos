import { TableroDomicilio } from "@/components/domicilio/TableroDomicilio";
import { RequiereSesion } from "@/components/RequiereSesion";

export const metadata = {
  title: "Domicilio · Trattoria Blue",
};

export default function DomicilioPage() {
  return (
    <RequiereSesion>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        <TableroDomicilio />
      </main>
    </RequiereSesion>
  );
}
