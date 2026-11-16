'use client';

/**
 * An in-page link that moves focus to its target without changing the URL
 * hash. The hash holds the worksheet data, so ordinary "#id" links would
 * overwrite it. Without JavaScript it still works as a normal anchor.
 */
export function JumpLink({
  targetId,
  className,
  children,
}: {
  targetId: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`#${targetId}`}
      className={className}
      onClick={(e) => {
        const target = document.getElementById(targetId);
        if (!target) return;
        e.preventDefault();
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        const reduce =
          document.documentElement.dataset.motion === 'reduced' ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }}
    >
      {children}
    </a>
  );
}
