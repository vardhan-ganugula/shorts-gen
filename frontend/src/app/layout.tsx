import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Klap - Turn Long Videos into Viral Shorts with AI',
  description: 'AI-powered video clipping tool with auto-reframing, viral scoring, and animated dynamic captions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
