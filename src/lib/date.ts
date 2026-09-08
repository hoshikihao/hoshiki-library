// 收录时间：frontmatter 里存 ISO 8601（带 +08:00，精确到分用于排序），
// 显示时只取到「日」，且固定按东八区，避免构建环境时区不同导致错位。

export function ymd(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}
