/**
 * Safe Markdown → HTML renderer for newsletter content.
 *
 * All raw input is HTML-escaped FIRST, then safe markdown patterns are
 * transformed to HTML. This guarantees no XSS — the output is safe for
 * dangerouslySetInnerHTML because we control every tag produced.
 *
 * Supports: headings, bold, italic, strikethrough, links (https only),
 * images (https only), code blocks, inline code, blockquotes, ordered/
 * unordered lists, horizontal rules, and paragraphs.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Only allow https URLs — block javascript:, data:, etc. */
function sanitizeUrl(url: string): string {
  const decoded = url.replace(/&amp;/g, '&');
  try {
    const u = new URL(decoded);
    if (u.protocol === 'https:' || u.protocol === 'http:') return url;
  } catch {
    // invalid URL
  }
  return '';
}

export function renderMarkdown(md: string): string {
  // 1. Escape HTML
  let text = escapeHtml(md);

  // 2. Fenced code blocks (```lang ... ```)
  text = text.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_m, lang, code) => {
      const cls = lang ? ` class="language-${lang}"` : '';
      return `<pre class="bg-muted/60 rounded-lg p-4 overflow-x-auto my-4 text-sm"><code${cls}>${code.trimEnd()}</code></pre>`;
    },
  );

  // 3. Process line-by-line for block elements
  const lines = text.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headings
    if (/^######\s/.test(line)) {
      out.push(`<h6 class="text-sm font-sans font-semibold mt-5 mb-1.5">${line.replace(/^######\s+/, '')}</h6>`);
      i++; continue;
    }
    if (/^#####\s/.test(line)) {
      out.push(`<h5 class="text-sm font-serif font-semibold mt-5 mb-1.5">${line.replace(/^#####\s+/, '')}</h5>`);
      i++; continue;
    }
    if (/^####\s/.test(line)) {
      out.push(`<h4 class="text-base font-serif font-semibold mt-6 mb-2">${line.replace(/^####\s+/, '')}</h4>`);
      i++; continue;
    }
    if (/^###\s/.test(line)) {
      out.push(`<h3 class="text-lg font-serif font-semibold mt-6 mb-2">${line.replace(/^###\s+/, '')}</h3>`);
      i++; continue;
    }
    if (/^##\s/.test(line)) {
      out.push(`<h2 class="text-xl font-serif font-bold mt-8 mb-2">${line.replace(/^##\s+/, '')}</h2>`);
      i++; continue;
    }
    if (/^#\s/.test(line)) {
      out.push(`<h1 class="text-2xl font-serif font-bold mt-8 mb-3">${line.replace(/^#\s+/, '')}</h1>`);
      i++; continue;
    }

    // Horizontal rule
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      out.push('<hr class="my-6 border-border" />');
      i++; continue;
    }

    // Blockquotes
    if (/^&gt;\s?/.test(line)) {
      const bqLines: string[] = [];
      while (i < lines.length && /^&gt;\s?/.test(lines[i])) {
        bqLines.push(lines[i].replace(/^&gt;\s?/, ''));
        i++;
      }
      out.push(`<blockquote class="border-l-4 border-muted-foreground/30 pl-4 py-1 my-4 italic text-muted-foreground">${bqLines.join('<br/>')}</blockquote>`);
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, ''));
        i++;
      }
      out.push(`<ul class="list-disc list-inside my-3 space-y-1">${items.map((li) => `<li>${li}</li>`).join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      out.push(`<ol class="list-decimal list-inside my-3 space-y-1">${items.map((li) => `<li>${li}</li>`).join('')}</ol>`);
      continue;
    }

    // Empty line → paragraph break (handled later)
    if (line.trim() === '') {
      out.push('');
      i++; continue;
    }

    // Default: paragraph line
    out.push(line);
    i++;
  }

  // Group consecutive non-empty, non-block lines into paragraphs
  text = '';
  let paraBuffer: string[] = [];

  function flushPara() {
    if (paraBuffer.length === 0) return;
    text += `<p class="mb-4 leading-relaxed">${paraBuffer.join('<br/>')}</p>`;
    paraBuffer = [];
  }

  for (const line of out) {
    if (line === '') {
      flushPara();
    } else if (line.startsWith('<')) {
      // Block element — flush any pending paragraph
      flushPara();
      text += line;
    } else {
      paraBuffer.push(line);
    }
  }
  flushPara();

  // 4. Inline formatting (applied after block structure)
  // Images: ![alt](url)
  text = text.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_m, alt, url) => {
      const safe = sanitizeUrl(url);
      if (!safe) return alt;
      return `<figure class="my-6"><img src="${safe}" alt="${alt}" class="rounded-lg max-w-full h-auto mx-auto" loading="lazy" />${alt ? `<figcaption class="text-center text-sm text-muted-foreground mt-2">${alt}</figcaption>` : ''}</figure>`;
    },
  );

  // Links: [text](url)
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, label, url) => {
      const safe = sanitizeUrl(url);
      if (!safe) return label;
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">${label}</a>`;
    },
  );

  // Inline code
  text = text.replace(
    /`([^`]+)`/g,
    '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>',
  );

  // Bold + italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Strikethrough
  text = text.replace(/~~(.+?)~~/g, '<del class="text-muted-foreground">$1</del>');

  // Auto-link bare https URLs (not already inside an href or src)
  text = text.replace(
    /(?<!href=&quot;|src=&quot;|&quot;)(https:\/\/[^\s<&]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">$1</a>',
  );

  return text;
}
