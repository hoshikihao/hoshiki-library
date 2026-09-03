// 从 Markdown 正文提取纯文本摘要，用于列表页与 RSS。

const MAX = 120;

export function excerpt(markdown: string, max = MAX): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ') // 代码块
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ') // 图片
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1') // 链接保留文字
    .replace(/^#{1,6}\s+/gm, '') // 标题符号
    .replace(/^\s{0,3}>\s?/gm, '') // 引用符号
    .replace(/[*_~`#>|-]/g, '') // 其余标记
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}
