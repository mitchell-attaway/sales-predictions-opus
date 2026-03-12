import { Sidebar } from '@/components/working-rate/Sidebar';

export const metadata = {
  title: 'Working Rate Dashboard — Harbinger',
  description: 'Track effective hourly working rates across client partnerships',
};

export default function WorkingRateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
