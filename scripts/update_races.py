"""마라톤GO 공개 일정 페이지에서 MRC용 최소 일정 데이터를 생성한다."""

from __future__ import annotations

import json
import re
import urllib.request
from datetime import date, datetime, timezone, timedelta
from html.parser import HTMLParser
from pathlib import Path


SOURCE_URL = "https://marathongo.co.kr/raceSchedule/domestic"
DETAIL_BASE = "https://marathongo.co.kr"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "races.json"
KST = timezone(timedelta(hours=9))


class RaceLinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.depth = 0
        self.href = ""
        self.texts: list[str] = []
        self.items: list[tuple[str, list[str]]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        href = dict(attrs).get("href") or ""
        if tag == "a" and href.startswith("/raceDetail/domestic/") and self.depth == 0:
            self.depth = 1
            self.href = href
            self.texts = []
        elif self.depth:
            self.depth += 1

    def handle_endtag(self, tag: str) -> None:
        if not self.depth:
            return
        self.depth -= 1
        if self.depth == 0:
            self.items.append((self.href, self.texts))

    def handle_data(self, data: str) -> None:
        if not self.depth:
            return
        text = " ".join(data.split())
        if text and not text.startswith((".css-", "@media", "@keyframes")) and "{" not in text:
            self.texts.append(text)


def fetch_html() -> str:
    request = urllib.request.Request(
        SOURCE_URL,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; MRC-Race-Calendar/1.0; +https://kimyoungjin06.github.io/modu_running/)"
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def parse_date(year: str, label: str) -> str:
    match = re.fullmatch(r"(\d{1,2})월\s*(\d{1,2})일", label)
    if not match:
        raise ValueError(f"대회 날짜 형식을 해석할 수 없습니다: {label}")
    return date(int(year), int(match.group(1)), int(match.group(2))).isoformat()


def normalize_course(course: str) -> str:
    compact = re.sub(r"\s+", "", course).lower()
    if "풀" in compact or compact in {"full", "fullcourse"}:
        return "full"
    if "하프" in compact or compact in {"half", "halfcourse"}:
        return "half"
    if re.fullmatch(r"10(?:k|km)", compact):
        return "10km"
    return compact


def parse_item(href: str, texts: list[str]) -> dict | None:
    try:
        status_index = next(i for i, text in enumerate(texts) if text in {"접수전", "접수중", "접수마감"})
        before = texts[:status_index]
        pipe_indexes = [i for i, text in enumerate(before) if text == "|"]
        if len(pipe_indexes) < 3:
            return None

        first_pipe, second_pipe, third_pipe = pipe_indexes[-3:]
        race_name = before[first_pipe - 2]
        region = before[first_pipe - 1]
        place = " ".join(before[first_pipe + 1:second_pipe])
        race_start = " ".join(before[second_pipe + 1:third_pipe])
        year = before[third_pipe + 1]
        date_label_index = next(i for i, text in enumerate(before) if re.fullmatch(r"\d{1,2}월\s*\d{1,2}일", text))
        courses = before[date_label_index + 2:first_pipe - 2]

        range_index = next(
            i for i in range(status_index + 1, len(texts))
            if re.fullmatch(r"\d{4}\.\d{2}\.\d{2}\s*~\s*\d{4}\.\d{2}\.\d{2}", texts[i])
        )
        start_text, end_text = [part.strip() for part in texts[range_index].split("~")]
        host = texts[range_index + 1] if range_index + 1 < len(texts) else ""
        normalized_courses = list(dict.fromkeys(normalize_course(course) for course in courses))
        if not any(course in {"full", "half", "10km"} for course in normalized_courses):
            return None

        return {
            "id": href.rsplit("/", 1)[-1],
            "name": race_name,
            "raceDate": parse_date(year, before[date_label_index]),
            "registrationOpen": start_text.replace(".", "-"),
            "registrationClose": end_text.replace(".", "-"),
            "registrationStatus": texts[status_index],
            "courses": normalized_courses,
            "region": region,
            "place": place,
            "start": race_start,
            "host": host,
            "sourceUrl": f"{DETAIL_BASE}{href}",
        }
    except (StopIteration, ValueError, IndexError):
        return None


def main() -> None:
    parser = RaceLinkParser()
    parser.feed(fetch_html())
    races_by_id: dict[str, dict] = {}
    for href, texts in parser.items:
        race = parse_item(href, texts)
        if race:
            races_by_id[race["id"]] = race

    races = sorted(races_by_id.values(), key=lambda item: (item["raceDate"], item["name"]))
    if len(races) < 20:
        raise RuntimeError(f"추출된 대회가 너무 적어 갱신을 중단합니다: {len(races)}개")

    payload = {
        "source": {
            "name": "마라톤GO",
            "url": SOURCE_URL,
            "retrievedAt": datetime.now(KST).isoformat(timespec="seconds"),
            "notice": "일정은 변경될 수 있으므로 참가 전 공식 대회 안내를 확인해 주세요.",
        },
        "races": races,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(races)}개 대회를 {OUTPUT.relative_to(ROOT)}에 저장했습니다.")


if __name__ == "__main__":
    main()
