import type { Metadata } from 'next';
import { StudentClient } from './StudentClient';

export const metadata: Metadata = { title: 'Student view' };

export default function StudentPage() {
  return <StudentClient />;
}
