"use client";

interface StatementBlockProps {
  title: string;
  description?: string | null;
}

export function StatementBlock({ title, description }: StatementBlockProps) {
  return (
    <div className="space-y-2 py-4">
      <h3 className="text-xl font-bold font-heading text-on-surface">
        {title}
      </h3>
      {description && (
        <p className="text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
