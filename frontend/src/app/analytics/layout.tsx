import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Creator Analytics — E.D.I.T.H.',
  description: 'Track your content performance, engagement, affiliate revenue, and audience insights.',
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
