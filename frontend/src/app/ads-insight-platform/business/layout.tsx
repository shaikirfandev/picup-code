import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Business Manager — E.D.I.T.H.',
  description: 'Manage your business, team, ad accounts, and product catalogs.',
};

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
