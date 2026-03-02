const express = require('express');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const app = express();
const PORT = 4000;
const BASE = process.cwd();

function formatDate(d) {
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return String(d);
}

function readCollection(dir) {
  const fullDir = path.join(BASE, dir);
  if (!fs.existsSync(fullDir)) return [];
  return fs.readdirSync(fullDir)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const raw = fs.readFileSync(path.join(fullDir, file), 'utf8');
      const { data, content } = matter(raw);
      const result = { ...data, _content: content.trim(), _file: file, _slug: file.replace('.md', '') };
      if (result.date) result.date = formatDate(result.date);
      if (result.start_date) result.start_date = formatDate(result.start_date);
      return result;
    });
}

function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - Reading Log</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f6f8fa; color: #24292e; }
    header { background: #24292e; color: white; padding: 16px 32px; display: flex; align-items: center; gap: 10px; }
    header a { color: white; text-decoration: none; font-size: 20px; font-weight: 600; }
    main { max-width: 860px; margin: 32px auto; padding: 0 16px; }
    h1 { font-size: 22px; margin-bottom: 16px; color: #24292e; }
    h2 { font-size: 16px; margin-bottom: 12px; color: #586069; font-weight: 600; }
    .card { background: white; border: 1px solid #e1e4e8; border-radius: 8px; padding: 16px 20px; margin-bottom: 10px; transition: box-shadow .15s; }
    .card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .card-title { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
    .card-title a { color: #0366d6; text-decoration: none; }
    .card-title a:hover { text-decoration: underline; }
    .meta { font-size: 13px; color: #586069; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
    .badge-blue { background: #e8f4fd; color: #0366d6; }
    .badge-green { background: #dcffe4; color: #22863a; }
    .badge-red { background: #ffeef0; color: #cb2431; }
    .badge-yellow { background: #fff3cd; color: #856404; }
    .section { margin-bottom: 36px; }
    .back { display: inline-flex; align-items: center; gap: 4px; margin-bottom: 16px; color: #0366d6; text-decoration: none; font-size: 14px; }
    .back:hover { text-decoration: underline; }
    hr { border: none; border-top: 1px solid #e1e4e8; margin: 16px 0; }
    .content { line-height: 1.7; font-size: 15px; }
    .content p { margin-bottom: 12px; }
    .empty { color: #586069; font-size: 14px; padding: 20px 0; }
    .book-header { background: white; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; }
    .book-header h1 { margin-bottom: 10px; }
    .stat { font-size: 24px; font-weight: 700; color: #0366d6; }
  </style>
</head>
<body>
  <header><a href="/">📚 Reading Log</a></header>
  <main>${body}</main>
</body>
</html>`;
}

// ── 홈
app.get('/', (req, res) => {
  const books = readCollection('_books');
  const logs = readCollection('_logs').sort((a, b) => new Date(b.date) - new Date(a.date));

  const booksHtml = books.length
    ? books.map(book => {
        const bookLogs = logs.filter(l => l.book === book.slug);
        const total = bookLogs.reduce((s, l) => s + (l.pages_read ?? l.chapters_read ?? 0), 0);
        const unit = book.pages_per_day ? 'p' : '장';
        const plan = book.pages_per_day ? `하루 ${book.pages_per_day}p` : `하루 ${book.chapters_per_day ?? '?'}장`;
        return `<div class="card">
          <div class="card-title"><a href="/books/${book.slug}">${book.title}</a></div>
          <div class="meta">
            <span>${book.author}</span>
            <span class="badge badge-yellow">${plan}</span>
            <span>시작일 ${book.start_date}</span>
            <span>누적 <strong>${total}${unit}</strong></span>
          </div>
        </div>`;
      }).join('')
    : '<p class="empty">등록된 책이 없습니다.</p>';

  const logsHtml = logs.length
    ? logs.slice(0, 10).map(log => logCard(log)).join('')
    : '<p class="empty">아직 기록이 없습니다.</p>';

  res.send(layout('홈', `
    <div class="section">
      <h1>📖 등록된 책</h1>
      ${booksHtml}
    </div>
    <div class="section">
      <h1>📝 최근 독서 기록</h1>
      ${logsHtml}
    </div>
  `));
});

// ── 책 상세
app.get('/books/:slug', (req, res) => {
  const books = readCollection('_books');
  const book = books.find(b => b.slug === req.params.slug);
  if (!book) return res.status(404).send(layout('404', '<p>책을 찾을 수 없습니다.</p>'));

  const logs = readCollection('_logs')
    .filter(l => l.book === book.slug)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = logs.reduce((s, l) => s + (l.pages_read ?? l.chapters_read ?? 0), 0);
  const unit = book.pages_per_day ? 'p' : '장';
  const plan = book.pages_per_day ? `하루 ${book.pages_per_day}p` : `하루 ${book.chapters_per_day ?? '?'}장`;

  const logsHtml = logs.length
    ? logs.map(log => logCard(log)).join('')
    : '<p class="empty">아직 기록이 없습니다.</p>';

  res.send(layout(book.title, `
    <a class="back" href="/">← 목록으로</a>
    <div class="book-header">
      <h1>${book.title}</h1>
      <div class="meta">
        <span>${book.author}</span>
        <span class="badge badge-yellow">${plan}</span>
        <span>시작일 ${book.start_date}</span>
        <span>누적 <span class="stat">${total}</span>${unit}</span>
      </div>
      ${book._content ? `<hr><div class="content">${marked.parse(book._content)}</div>` : ''}
    </div>
    <h2>독서 기록 (${logs.length}회)</h2>
    ${logsHtml}
  `));
});

// ── 로그 상세
app.get('/logs/:id', (req, res) => {
  const logs = readCollection('_logs');
  const log = logs.find(l => l._slug === req.params.id);
  if (!log) return res.status(404).send(layout('404', '<p>기록을 찾을 수 없습니다.</p>'));

  const goal = 3;
  const readCount = log.pages_read ?? log.chapters_read ?? 0;
  const achieved = readCount >= goal;
  const unit = log.pages_read != null ? 'p' : '장';
  const range = log.pages_read != null
    ? `${log.from_page}~${log.to_page}p`
    : `Ch.${log.from_chapter}~${log.to_chapter}`;

  res.send(layout(`${log.date}`, `
    <a class="back" href="/books/${log.book}">← ${log.book}으로</a>
    <div class="book-header">
      <h1>${log.date}</h1>
      <div class="meta" style="margin-top:8px">
        <span>${range}</span>
        <span class="badge ${achieved ? 'badge-green' : 'badge-red'}">${achieved ? '✅ 달성' : '❌ 미달성'} (${readCount}${unit})</span>
      </div>
      ${log.memo ? `<p style="margin-top:12px;color:#586069;font-size:14px">${log.memo}</p>` : ''}
      ${log._content ? `<hr><div class="content">${marked.parse(log._content)}</div>` : ''}
    </div>
  `));
});

function logCard(log) {
  const readCount = log.pages_read ?? log.chapters_read ?? 0;
  const achieved = readCount >= 3;
  const unit = log.pages_read != null ? 'p' : '장';
  const range = log.pages_read != null
    ? `${log.from_page}~${log.to_page}p`
    : `Ch.${log.from_chapter}~${log.to_chapter}`;
  return `<div class="card">
    <div class="card-title"><a href="/logs/${log._slug}">${log.date} — ${log.book}</a></div>
    <div class="meta">
      <span>${range}</span>
      <span class="badge ${achieved ? 'badge-green' : 'badge-red'}">${achieved ? '✅ 달성' : '❌ 미달성'} (${readCount}${unit})</span>
      ${log.memo ? `<span style="color:#586069">${log.memo}</span>` : ''}
    </div>
  </div>`;
}

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n✅ 서버 실행 중 → ${url}\n`);
  require('child_process').exec(`start ${url}`);
});
