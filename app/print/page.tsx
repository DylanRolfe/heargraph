import type { Metadata } from 'next';
import { PrintClient } from './PrintClient';

export const metadata: Metadata = { title: 'Printable version' };

export default function PrintPage() {
  return <PrintClient />;
}
