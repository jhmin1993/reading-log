---
layout: default
title: "독서 대시보드"
---

# 독서 대시보드

## 현재 읽는 책

{% for book in site.books %}
{% assign book_logs = site.logs | where: "book", book.slug | sort: "date" %}
{% assign total_read = 0 %}
{% for log in book_logs %}
  {% assign total_read = total_read | plus: log.chapters_read %}
{% endfor %}
{% assign pct = total_read | times: 100 | divided_by: book.total_chapters %}

### [{{ book.title }}]({{ site.baseurl }}/books/{{ book.slug }}/)
- 저자: {{ book.author }}
- 진행: {{ total_read }} / {{ book.total_chapters }}장 ({{ pct }}%)
- 시작일: {{ book.start_date }}

{% endfor %}

---

## 최근 독서 기록

| 날짜 | 책 | 읽은 장 | 목표 달성 |
|------|-----|--------|--------|
{% assign recent = site.logs | sort: "date" | reverse %}
{% for log in recent limit:20 %}
| {{ log.date | date: "%Y-%m-%d" }} | {{ log.book }} | {{ log.chapters_read }}장 | {% if log.chapters_read >= 3 %}✅{% else %}❌{% endif %} |
{% endfor %}
