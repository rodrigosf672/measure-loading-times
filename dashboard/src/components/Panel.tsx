import type { ReactNode } from 'react';

export function Panel({ title, desc, right, children }: {
  title: string;
  desc?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">{title}</span>
        {desc && <span className="panel-desc">{desc}</span>}
        {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
      </div>
      {children}
    </div>
  );
}

export function PageHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="page-head">
      <h1 className="page-title">{title}</h1>
      <span className="page-desc">{desc}</span>
    </div>
  );
}
