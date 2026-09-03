// 极简 Markdown 内联渲染，仅供「文末点评」这类短文本使用。
// 支持：段落、**粗体**、*斜体*、`代码`、[链接](url)。不支持标题/列表/引用等块级语法。

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(
      /\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" rel="noopener">$1</a>',
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
}

export function renderMiniMarkdown(src: string): string {
  return src
    .trim()
    .split(/\n{2,}/)
    .map((block) => `<p>${inline(block.trim()).replace(/\n/g, '<br />')}</p>`)
    .join('\n');
}
