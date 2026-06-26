import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface BossPageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  actions?: React.ReactNode;
}

export default function BossPageHeader({ title, description, backHref, actions }: BossPageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-2">
      <div className="flex items-start gap-2">
        {backHref && (
          <Link
            href={backHref}
            className="mt-1 rounded p-1 text-boss-text-secondary hover:bg-boss-elevated hover:text-boss-text"
            aria-label="뒤로"
          >
            <ChevronLeft size={20} />
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold text-boss-text">{title}</h1>
          {description && <p className="mt-1 text-sm text-boss-text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
