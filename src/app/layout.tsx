import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rally Timing Coordinator',
  description: 'Coordinate rally attacks with staggered arrival timing',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-primary to-secondary/90 font-sans text-gray-800">
        <div className="container mx-auto px-4 py-6">{children}</div>
      </body>
    </html>
  );
}


