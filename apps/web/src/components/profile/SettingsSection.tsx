export interface SettingsSectionProps {
  label: string;
  children: React.ReactNode;
}

export function SettingsSection({ label, children }: SettingsSectionProps) {
  return (
    <div>
      <p className="mt-6 mb-2 px-5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
        {label}
      </p>
      <div className="mx-5 divide-y divide-neutral-100 overflow-hidden rounded-xl bg-neutral-0 shadow-card">
        {children}
      </div>
    </div>
  );
}
