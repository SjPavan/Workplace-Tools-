import { ExternalLink } from 'lucide-react';

interface CitationChipProps {
  title: string;
  url: string;
  index: number;
}

export function CitationChip({ title, url, index }: CitationChipProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20 transition-colors"
      title={title}
    >
      <span>[{index + 1}]</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}