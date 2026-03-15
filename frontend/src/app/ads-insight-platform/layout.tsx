import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ads Insight Platform — E.D.I.T.H.',
  description: 'Manage campaigns, view ad reports, get AI recommendations, and plan media.',
};

export default function AdsInsightLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
