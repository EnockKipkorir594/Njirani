
type SectionHeaderProps = {
    title: string;
    badge?: string;
    subtitle?: string;
    centered?: boolean;
    className?: string;
  };
  
  export function SectionHeader({
    title,
    badge,
    subtitle,
    centered = true,
    className = "",
  }: SectionHeaderProps) {
    return (
      <header
        className={`space-y-4 ${
          centered ? "text-center" : "text-left"
        } ${className}`}
      >
        {badge && (
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            {badge}
          </p>
        )}
  
        <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
          {title}
        </h2>
  
        {subtitle && (
          <p
            className={`text-lg leading-relaxed text-surface-muted-text ${
              centered ? "mx-auto" : ""
            } max-w-2xl`}
          >
            {subtitle}
          </p>
        )}
      </header>
    );
  }
  