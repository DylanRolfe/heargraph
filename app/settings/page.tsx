import type { Metadata } from 'next';
import { SettingsForm } from './SettingsForm';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <h1>Settings</h1>
      <p className="lead">
        Changes apply straight away and are saved in this browser only. They are not sent anywhere.
      </p>
      <SettingsForm />
    </>
  );
}
