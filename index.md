---
layout: default
title: "독서 대시보드"
---

# 독서 대시보드

## 현재 읽는 책

{% for book in site.books %}
{% assign book_logs = site.logs | where: "book", book.slug | sort: "date" %}
{% assign total_read = 0 %}
{% if book.pages_per_day %}
  {% for log in book_logs %}
    {% assign total_read = total_read | plus: log.pages_read %}
  {% endfor %}
  {% assign unit = "p" %}
  {% assign plan = book.pages_per_day | append: "p/일" %}
{% else %}
  {% for log in book_logs %}
    {% assign total_read = total_read | plus: log.chapters_read %}
  {% endfor %}
  {% assign unit = "장" %}
  {% assign plan = book.chapters_per_day | append: "장/일" %}
{% endif %}

### [{{ book.title }}]({{ site.baseurl }}/books/{{ book.slug }}/)
- 저자: {{ book.author }}
- 목표: {{ plan }}
- 누적: {{ total_read }}{{ unit }}
- 시작일: {{ book.start_date }}

{% endfor %}

---

## 최근 독서 기록

| 날짜 | 책 | 읽은 양 | 목표 달성 |
|------|-----|--------|--------|
{% assign recent = site.logs | sort: "date" | reverse %}
{% for log in recent limit:20 %}
{% if log.pages_read %}
| {{ log.date | date: "%Y-%m-%d" }} | {{ log.book }} | {{ log.pages_read }}p | {% if log.pages_read >= 3 %}✅{% else %}❌{% endif %} |
{% else %}
| {{ log.date | date: "%Y-%m-%d" }} | {{ log.book }} | {{ log.chapters_read }}장 | {% if log.chapters_read >= 3 %}✅{% else %}❌{% endif %} |
{% endif %}
{% endfor %}
