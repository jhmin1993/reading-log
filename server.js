const express = require('express');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const app = express();
app.use(express.urlencoded({ extended: false }));
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
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#24292e">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="apple-touch-icon" href="/assets/icons/icon.svg">
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
    .back { display: inline-flex; align-items: center; gap: 4px; margin-bottom: 16px; padding: 6px 12px; background: white; color: #24292e; border: 1px solid #d0d7de; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; }
    .back:hover { background: #f6f8fa; border-color: #b0b7be; }
    hr { border: none; border-top: 1px solid #e1e4e8; margin: 16px 0; }
    .content { line-height: 1.7; font-size: 15px; }
    .content p { margin-bottom: 12px; }
    .empty { color: #586069; font-size: 14px; padding: 20px 0; }
    .book-header { background: white; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; }
    .book-header h1 { margin-bottom: 10px; }
    .stat { font-size: 24px; font-weight: 700; color: #0366d6; }
    .btn { display: inline-block; padding: 7px 14px; background: #0366d6; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; }
    .btn:hover { background: #0256c7; }
    .btn-danger { background: #cb2431; }
    .btn-danger:hover { background: #a81c25; }
    .btn-sm { padding: 4px 10px; font-size: 12px; }
    .action-row { display: flex; gap: 8px; margin-top: 12px; }
    .form-card { background: white; border: 1px solid #e1e4e8; border-radius: 8px; padding: 24px; }
    .form-row { margin-bottom: 16px; }
    .form-row label { display: block; font-size: 13px; font-weight: 600; color: #586069; margin-bottom: 6px; }
    .form-row input, .form-row select, .form-row textarea { width: 100%; padding: 8px 10px; border: 1px solid #d0d7de; border-radius: 6px; font-size: 14px; font-family: inherit; color: #24292e; }
    .form-row textarea { resize: vertical; }
    .form-row input:focus, .form-row select:focus, .form-row textarea:focus { outline: none; border-color: #0366d6; box-shadow: 0 0 0 3px rgba(3,102,214,.15); }
    .inline-row { display: flex; gap: 12px; }
    .inline-row .form-row { flex: 1; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .section-header h1 { margin-bottom: 0; }
  </style>
</head>
<body>
  <header><a href="/">📚 Reading Log</a></header>
  <main>${body}</main>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }
  </script>
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
            <a href="/books/${book.slug}/edit" class="btn btn-sm" style="margin-left:auto">편집</a>
            <form method="POST" action="/books/${book.slug}/delete" style="display:inline" onsubmit="return confirm('책을 삭제하면 관련 기록도 모두 삭제됩니다. 계속할까요?')">
              <button type="submit" class="btn btn-sm btn-danger">삭제</button>
            </form>
          </div>
        </div>`;
      }).join('')
    : '<p class="empty">등록된 책이 없습니다.</p>';

  const logsHtml = logs.length
    ? logs.slice(0, 10).map(log => logCard(log)).join('')
    : '<p class="empty">아직 기록이 없습니다.</p>';

  res.send(layout('홈', `
    <div class="section">
      <div class="section-header">
        <h1>📖 등록된 책</h1>
        <a href="/books/new" class="btn">+ 책 추가</a>
      </div>
      ${booksHtml}
    </div>
    <div class="section">
      <div class="section-header">
        <h1>📝 최근 독서 기록</h1>
        <a href="/logs/new" class="btn">+ 기록 추가</a>
      </div>
      ${logsHtml}
    </div>
  `));
});

// ── 책 추가 폼
app.get('/books/new', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  res.send(layout('책 추가', `
    <a class="back" href="/">← 목록으로</a>
    <h1>📖 책 추가</h1>
    <div class="form-card">
      <form method="POST" action="/books/new">
        <div class="form-row">
          <label>제목</label>
          <input type="text" name="title" placeholder="책 제목" required>
        </div>
        <div class="form-row">
          <label>저자</label>
          <input type="text" name="author" placeholder="저자 이름" required>
        </div>
        <div class="form-row">
          <label>슬러그 <span style="font-weight:400;color:#999">(영문 소문자, 하이픈만 사용)</span></label>
          <input type="text" name="slug" id="slug-input" placeholder="my-book" pattern="[a-z0-9\-]+" required>
        </div>
        <div class="form-row">
          <label>시작일</label>
          <input type="date" name="start_date" value="${today}" required>
        </div>
        <div class="form-row">
          <label>읽기 방식</label>
          <select name="mode" id="mode-select">
            <option value="chapter">챕터 단위</option>
            <option value="page">페이지 단위</option>
          </select>
        </div>
        <div id="chapter-fields">
          <div class="inline-row">
            <div class="form-row">
              <label>총 챕터 수 (선택)</label>
              <input type="number" name="total_chapters" min="1" placeholder="예: 17">
            </div>
            <div class="form-row">
              <label>하루 목표 챕터 (선택)</label>
              <input type="number" name="chapters_per_day" min="1" placeholder="예: 2">
            </div>
          </div>
        </div>
        <div id="page-fields" style="display:none">
          <div class="form-row">
            <label>하루 목표 페이지</label>
            <input type="number" name="pages_per_day" min="1" placeholder="예: 30">
          </div>
        </div>
        <div class="form-row">
          <label>메모 (선택)</label>
          <textarea name="memo" rows="3" placeholder="책 소개나 메모..."></textarea>
        </div>
        <button type="submit" class="btn">저장</button>
      </form>
    </div>
    <script>
      const titleEl = document.querySelector('[name=title]');
      const slugEl = document.getElementById('slug-input');
      titleEl.addEventListener('input', () => {
        if (!slugEl.dataset.edited) {
          slugEl.value = titleEl.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        }
      });
      slugEl.addEventListener('input', () => { slugEl.dataset.edited = '1'; });

      const modeEl = document.getElementById('mode-select');
      modeEl.addEventListener('change', () => {
        document.getElementById('chapter-fields').style.display = modeEl.value === 'chapter' ? '' : 'none';
        document.getElementById('page-fields').style.display = modeEl.value === 'page' ? '' : 'none';
      });
    </script>
  `));
});

app.post('/books/new', (req, res) => {
  const { title, author, slug, start_date, mode, total_chapters, chapters_per_day, pages_per_day, memo } = req.body;
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return res.status(400).send(layout('오류', '<p>슬러그가 올바르지 않습니다.</p>'));

  const lines = ['---', `slug: ${slug}`, `title: "${title}"`, `author: "${author}"`, `start_date: ${start_date}`];
  if (mode === 'page') {
    if (pages_per_day) lines.push(`pages_per_day: ${parseInt(pages_per_day, 10)}`);
  } else {
    if (total_chapters) lines.push(`total_chapters: ${parseInt(total_chapters, 10)}`);
    if (chapters_per_day) lines.push(`chapters_per_day: ${parseInt(chapters_per_day, 10)}`);
  }
  lines.push('---');
  if (memo && memo.trim()) lines.push('', memo.trim());

  fs.writeFileSync(path.join(BASE, '_books', `${slug}.md`), lines.join('\n') + '\n');
  res.redirect(`/books/${slug}`);
});

// ── 책 편집 폼
app.get('/books/:slug/edit', (req, res) => {
  const books = readCollection('_books');
  const book = books.find(b => b.slug === req.params.slug);
  if (!book) return res.status(404).send(layout('404', '<p>책을 찾을 수 없습니다.</p>'));

  const isPage = !!book.pages_per_day;
  res.send(layout('책 편집', `
    <a class="back" href="/books/${book.slug}">← 돌아가기</a>
    <h1>✏️ 책 편집</h1>
    <div class="form-card">
      <form method="POST" action="/books/${book.slug}/edit">
        <div class="form-row">
          <label>제목</label>
          <input type="text" name="title" value="${book.title}" required>
        </div>
        <div class="form-row">
          <label>저자</label>
          <input type="text" name="author" value="${book.author}" required>
        </div>
        <div class="form-row">
          <label>시작일</label>
          <input type="date" name="start_date" value="${book.start_date}" required>
        </div>
        <div class="form-row">
          <label>읽기 방식</label>
          <select name="mode" id="mode-select">
            <option value="chapter"${!isPage ? ' selected' : ''}>챕터 단위</option>
            <option value="page"${isPage ? ' selected' : ''}>페이지 단위</option>
          </select>
        </div>
        <div id="chapter-fields"${isPage ? ' style="display:none"' : ''}>
          <div class="inline-row">
            <div class="form-row">
              <label>총 챕터 수 (선택)</label>
              <input type="number" name="total_chapters" min="1" value="${book.total_chapters ?? ''}">
            </div>
            <div class="form-row">
              <label>하루 목표 챕터 (선택)</label>
              <input type="number" name="chapters_per_day" min="1" value="${book.chapters_per_day ?? ''}">
            </div>
          </div>
        </div>
        <div id="page-fields"${!isPage ? ' style="display:none"' : ''}>
          <div class="form-row">
            <label>하루 목표 페이지</label>
            <input type="number" name="pages_per_day" min="1" value="${book.pages_per_day ?? ''}">
          </div>
        </div>
        <div class="form-row">
          <label>메모 (선택)</label>
          <textarea name="memo" rows="3">${book._content ?? ''}</textarea>
        </div>
        <button type="submit" class="btn">저장</button>
      </form>
    </div>
    <script>
      const modeEl = document.getElementById('mode-select');
      modeEl.addEventListener('change', () => {
        document.getElementById('chapter-fields').style.display = modeEl.value === 'chapter' ? '' : 'none';
        document.getElementById('page-fields').style.display = modeEl.value === 'page' ? '' : 'none';
      });
    </script>
  `));
});

app.post('/books/:slug/edit', (req, res) => {
  const books = readCollection('_books');
  const book = books.find(b => b.slug === req.params.slug);
  if (!book) return res.status(404).send(layout('404', '<p>책을 찾을 수 없습니다.</p>'));

  const { title, author, start_date, mode, total_chapters, chapters_per_day, pages_per_day, memo } = req.body;
  const slug = book.slug;

  const lines = ['---', `slug: ${slug}`, `title: "${title}"`, `author: "${author}"`, `start_date: ${start_date}`];
  if (mode === 'page') {
    if (pages_per_day) lines.push(`pages_per_day: ${parseInt(pages_per_day, 10)}`);
  } else {
    if (total_chapters) lines.push(`total_chapters: ${parseInt(total_chapters, 10)}`);
    if (chapters_per_day) lines.push(`chapters_per_day: ${parseInt(chapters_per_day, 10)}`);
  }
  lines.push('---');
  if (memo && memo.trim()) lines.push('', memo.trim());

  fs.writeFileSync(path.join(BASE, '_books', book._file), lines.join('\n') + '\n');
  res.redirect(`/books/${slug}`);
});

// ── 책 삭제
app.post('/books/:slug/delete', (req, res) => {
  const books = readCollection('_books');
  const book = books.find(b => b.slug === req.params.slug);
  if (!book) return res.status(404).send(layout('404', '<p>책을 찾을 수 없습니다.</p>'));

  // 책 파일 삭제
  fs.unlinkSync(path.join(BASE, '_books', book._file));
  // 관련 기록 파일 삭제
  const logs = readCollection('_logs');
  logs.filter(l => l.book === book.slug).forEach(l => fs.unlinkSync(path.join(BASE, '_logs', l._file)));

  res.redirect('/');
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
      <div class="action-row">
        <a href="/books/${book.slug}/edit" class="btn btn-sm">편집</a>
        <form method="POST" action="/books/${book.slug}/delete" onsubmit="return confirm('책을 삭제하면 관련 기록도 모두 삭제됩니다. 계속할까요?')">
          <button type="submit" class="btn btn-sm btn-danger">삭제</button>
        </form>
      </div>
    </div>
    <h2>독서 기록 (${logs.length}회)</h2>
    ${logsHtml}
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
      <a href="/logs/${log._slug}/edit" class="btn btn-sm" style="margin-left:auto">편집</a>
      <form method="POST" action="/logs/${log._slug}/delete" style="display:inline" onsubmit="return confirm('이 기록을 삭제할까요?')">
        <button type="submit" class="btn btn-sm btn-danger">삭제</button>
      </form>
    </div>
  </div>`;
}

// ── 기록 추가 폼
app.get('/logs/new', (req, res) => {
  const books = readCollection('_books');
  const today = new Date().toISOString().split('T')[0];
  const booksJson = JSON.stringify(books.map(b => ({
    slug: b.slug,
    title: b.title,
    isPage: !!b.pages_per_day,
  })));

  const options = books.map(b =>
    `<option value="${b.slug}">${b.title}</option>`
  ).join('');

  res.send(layout('기록 추가', `
    <a class="back" href="/">← 목록으로</a>
    <h1>📝 기록 추가</h1>
    <div class="form-card">
      <form method="POST" action="/logs/new">
        <div class="form-row">
          <label>책</label>
          <select name="book" id="book-select">${options}</select>
        </div>
        <div class="form-row">
          <label>날짜</label>
          <input type="date" name="date" value="${today}" required>
        </div>
        <div class="inline-row">
          <div class="form-row">
            <label id="from-label">시작 챕터</label>
            <input type="number" name="from" id="from-input" min="1" required>
          </div>
          <div class="form-row">
            <label id="to-label">끝 챕터</label>
            <input type="number" name="to" id="to-input" min="1" required>
          </div>
        </div>
        <div class="form-row">
          <label>메모 (선택)</label>
          <textarea name="memo" rows="3" placeholder="오늘 읽은 내용 메모..."></textarea>
        </div>
        <button type="submit" class="btn">저장</button>
      </form>
    </div>
    <script>
      const books = ${booksJson};
      const sel = document.getElementById('book-select');
      function updateLabels() {
        const book = books.find(b => b.slug === sel.value);
        const unit = book && book.isPage ? '페이지' : '챕터';
        document.getElementById('from-label').textContent = '시작 ' + unit;
        document.getElementById('to-label').textContent = '끝 ' + unit;
      }
      sel.addEventListener('change', updateLabels);
      updateLabels();
    </script>
  `));
});

app.post('/logs/new', (req, res) => {
  const { book, date, from, to, memo } = req.body;
  const books = readCollection('_books');
  const bookData = books.find(b => b.slug === book);
  if (!bookData) return res.status(400).send(layout('오류', '<p>책을 찾을 수 없습니다.</p>'));

  const fromNum = parseInt(from, 10);
  const toNum = parseInt(to, 10);
  const count = toNum - fromNum + 1;
  const isPage = !!bookData.pages_per_day;

  const lines = [
    '---',
    `book: ${book}`,
    `date: ${date}`,
    isPage ? `pages_read: ${count}` : `chapters_read: ${count}`,
    isPage ? `from_page: ${fromNum}` : `from_chapter: ${fromNum}`,
    isPage ? `to_page: ${toNum}` : `to_chapter: ${toNum}`,
  ];
  if (memo && memo.trim()) lines.push(`memo: "${memo.trim().replace(/"/g, "'")}"`);
  lines.push('---');

  const filename = `${date}-${book}.md`;
  fs.writeFileSync(path.join(BASE, '_logs', filename), lines.join('\n') + '\n');

  res.redirect(`/books/${book}`);
});

// ── 기록 편집 폼
app.get('/logs/:id/edit', (req, res) => {
  const logs = readCollection('_logs');
  const log = logs.find(l => l._slug === req.params.id);
  if (!log) return res.status(404).send(layout('404', '<p>기록을 찾을 수 없습니다.</p>'));

  const books = readCollection('_books');
  const isPage = log.pages_read != null;
  const fromVal = isPage ? log.from_page : log.from_chapter;
  const toVal = isPage ? log.to_page : log.to_chapter;
  const booksJson = JSON.stringify(books.map(b => ({ slug: b.slug, title: b.title, isPage: !!b.pages_per_day })));
  const options = books.map(b =>
    `<option value="${b.slug}"${b.slug === log.book ? ' selected' : ''}>${b.title}</option>`
  ).join('');

  res.send(layout('기록 편집', `
    <a class="back" href="/logs/${log._slug}">← 돌아가기</a>
    <h1>✏️ 기록 편집</h1>
    <div class="form-card">
      <form method="POST" action="/logs/${log._slug}/edit">
        <div class="form-row">
          <label>책</label>
          <select name="book" id="book-select">${options}</select>
        </div>
        <div class="form-row">
          <label>날짜</label>
          <input type="date" name="date" value="${log.date}" required>
        </div>
        <div class="inline-row">
          <div class="form-row">
            <label id="from-label">시작 ${isPage ? '페이지' : '챕터'}</label>
            <input type="number" name="from" id="from-input" min="1" value="${fromVal}" required>
          </div>
          <div class="form-row">
            <label id="to-label">끝 ${isPage ? '페이지' : '챕터'}</label>
            <input type="number" name="to" id="to-input" min="1" value="${toVal}" required>
          </div>
        </div>
        <div class="form-row">
          <label>메모 (선택)</label>
          <textarea name="memo" rows="3" placeholder="오늘 읽은 내용 메모...">${log.memo ?? ''}</textarea>
        </div>
        <button type="submit" class="btn">저장</button>
      </form>
    </div>
    <script>
      const books = ${booksJson};
      const sel = document.getElementById('book-select');
      function updateLabels() {
        const book = books.find(b => b.slug === sel.value);
        const unit = book && book.isPage ? '페이지' : '챕터';
        document.getElementById('from-label').textContent = '시작 ' + unit;
        document.getElementById('to-label').textContent = '끝 ' + unit;
      }
      sel.addEventListener('change', updateLabels);
    </script>
  `));
});

// ── 기록 편집 저장
app.post('/logs/:id/edit', (req, res) => {
  const logs = readCollection('_logs');
  const log = logs.find(l => l._slug === req.params.id);
  if (!log) return res.status(404).send(layout('404', '<p>기록을 찾을 수 없습니다.</p>'));

  const { book, date, from, to, memo } = req.body;
  const books = readCollection('_books');
  const bookData = books.find(b => b.slug === book);
  if (!bookData) return res.status(400).send(layout('오류', '<p>책을 찾을 수 없습니다.</p>'));

  const fromNum = parseInt(from, 10);
  const toNum = parseInt(to, 10);
  const count = toNum - fromNum + 1;
  const isPage = !!bookData.pages_per_day;

  const lines = [
    '---',
    `book: ${book}`,
    `date: ${date}`,
    isPage ? `pages_read: ${count}` : `chapters_read: ${count}`,
    isPage ? `from_page: ${fromNum}` : `from_chapter: ${fromNum}`,
    isPage ? `to_page: ${toNum}` : `to_chapter: ${toNum}`,
  ];
  if (memo && memo.trim()) lines.push(`memo: "${memo.trim().replace(/"/g, "'")}"`);
  lines.push('---');

  const oldFile = path.join(BASE, '_logs', log._file);
  const newFilename = `${date}-${book}.md`;
  const newFile = path.join(BASE, '_logs', newFilename);

  if (oldFile !== newFile) fs.unlinkSync(oldFile);
  fs.writeFileSync(newFile, lines.join('\n') + '\n');

  res.redirect(`/logs/${date}-${book}`);
});

// ── 기록 삭제
app.post('/logs/:id/delete', (req, res) => {
  const logs = readCollection('_logs');
  const log = logs.find(l => l._slug === req.params.id);
  if (!log) return res.status(404).send(layout('404', '<p>기록을 찾을 수 없습니다.</p>'));

  const book = log.book;
  fs.unlinkSync(path.join(BASE, '_logs', log._file));
  res.redirect(`/books/${book}`);
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
      <div class="action-row">
        <a href="/logs/${log._slug}/edit" class="btn btn-sm">편집</a>
        <form method="POST" action="/logs/${log._slug}/delete" onsubmit="return confirm('이 기록을 삭제할까요?')">
          <button type="submit" class="btn btn-sm btn-danger">삭제</button>
        </form>
      </div>
    </div>
  `));
});

// ── PWA 정적 파일
app.use('/assets', express.static(path.join(BASE, 'assets')));

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(BASE, 'sw.js'));
});

app.get('/manifest.json', (req, res) => {
  const raw = JSON.parse(fs.readFileSync(path.join(BASE, 'manifest.json'), 'utf8'));
  raw.start_url = '/';
  raw.scope = '/';
  raw.icons = raw.icons.map(icon => ({ ...icon, src: icon.src.replace('/reading-log', '') }));
  res.json(raw);
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n✅ 서버 실행 중 → ${url}\n`);
  require('child_process').exec(`start ${url}`);
});
