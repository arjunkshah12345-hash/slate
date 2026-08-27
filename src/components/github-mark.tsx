export function GitHubMark({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://github.com/arjunkshah12345-hash/slate"
      target="_blank"
      rel="noreferrer"
      aria-label="Slate on GitHub"
      className={`gh-mark ${className}`}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
        <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 0 1 1.2-3.3 4.4 4.4 0 0 1 .1-3.2s1-.3 3.4 1.2a11.6 11.6 0 0 1 6.2 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2a4.7 4.7 0 0 1 1.2 3.3c0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
      </svg>
    </a>
  );
}
