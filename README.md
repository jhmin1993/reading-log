# Reading Log

하루 3~5장 독서 기록 트래커. Jekyll + GitHub Pages.

Live site: https://jhmin1993.github.io/reading-log

## 사용법

### 새 책 등록

`_books/<slug>.md` 파일 생성:

```yaml
---
slug: book-slug
title: "책 제목"
author: "저자"
total_chapters: 20
start_date: 2026-03-01
---
(선택) 책 소개, 메모
```

### 오늘 독서 기록

`_logs/YYYY-MM-DD-<slug>.md` 파일 생성:

```yaml
---
book: book-slug
date: 2026-03-02
chapters_read: 4
from_chapter: 1
to_chapter: 4
memo: "오늘 읽은 내용 요약"
---
```

### 배포

```bash
git add . && git commit -m "Add reading log for YYYY-MM-DD" && git push
```

## 목표 기준

- chapters_read >= 3 : ✅ 달성
- chapters_read < 3  : ❌ 미달성
