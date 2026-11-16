import type { Metadata } from 'next';
import { TeacherEditor } from '@/components/TeacherEditor';

export const metadata: Metadata = { title: 'Make an accessible graph' };

export default function TeacherPage() {
  return (
    <>
      <h1>Make an accessible graph</h1>
      <p className="lead">
        Give HearGraph the numbers behind a graph. You get a link that lets a student explore the graph by keyboard,
        sound, description and data table. No account is needed and nothing is stored.
      </p>
      <TeacherEditor />
    </>
  );
}
