'use client';
import {useMemo} from 'react';
import katex from 'katex';

const cls = (...x: (string | boolean | undefined)[]) => x.filter(Boolean).join(' ');

function renderPiece(raw: string, displayMode: boolean) {
  try {
    return katex.renderToString(raw, {
      throwOnError: false,
      displayMode,
      strict: 'ignore',
    });
  } catch {
    return raw;
  }
}

/** Render plain text mixed with $inline$ and $$block$$ LaTeX */
export default function MathText({
  text,
  className,
  as: Tag = 'span',
}: {
  text: string;
  className?: string;
  as?: 'span' | 'p' | 'div' | 'h2';
}) {
  const html = useMemo(() => {
    if (!text) return '';
    const parts: string[] = [];
    const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (m.index > last) {
        parts.push(escapeHtml(text.slice(last, m.index)));
      }
      if (m[1] != null) {
        parts.push(renderPiece(m[1].trim(), true));
      } else if (m[2] != null) {
        parts.push(renderPiece(m[2].trim(), false));
      }
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(escapeHtml(text.slice(last)));
    return parts.join('').replace(/\n/g, '<br/>');
  }, [text]);

  return (
    <Tag
      className={cls('math-text break-words [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto', className)}
      dangerouslySetInnerHTML={{__html: html}}
    />
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
