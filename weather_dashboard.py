"""気象庁と環境省の公開データを一画面に表示する小さなデスクトップアプリ。"""

from __future__ import annotations

import json
import re
import threading
import tkinter as tk
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from html import unescape
from pathlib import Path
from tkinter import messagebox, ttk
from urllib.request import Request, urlopen


BASE_DIR = Path(__file__).resolve().parent
LOCAL_WBGT_JS = BASE_DIR / "今のデータ.js"
ENV_WBGT_URL = "https://www.wbgt.env.go.jp/wbgt_data.php"
JMA_FORECAST_URL = "https://www.jma.go.jp/bosai/forecast/data/forecast/{code}.json"
JMA_AREA_URL = "https://www.jma.go.jp/bosai/common/const/area.json"
USER_AGENT = "WeatherDashboard/1.0 (personal desktop use)"
JST = timezone(timedelta(hours=9), "JST")

# 環境省の全国47地点の代表地点名: 気象庁の府県予報区コード
CITY_CODES = {
    "札幌": "016000", "青森": "020000", "秋田": "050000", "盛岡": "030000",
    "仙台": "040000", "山形": "060000", "福島": "070000", "水戸": "080000",
    "宇都宮": "090000", "前橋": "100000", "熊谷": "110000", "東京": "130000",
    "銚子": "120000", "千葉": "120000", "横浜": "140000", "長野": "200000", "甲府": "190000",
    "静岡": "220000", "名古屋": "230000", "岐阜": "210000", "津": "240000",
    "新潟": "150000", "富山": "160000", "金沢": "170000", "福井": "180000",
    "彦根": "250000", "京都": "260000", "大阪": "270000", "神戸": "280000",
    "奈良": "290000", "和歌山": "300000", "岡山": "330000", "広島": "340000",
    "松江": "320000", "鳥取": "310000", "下関": "350000", "徳島": "360000",
    "高松": "370000", "松山": "380000", "高知": "390000", "福岡": "400000",
    "大分": "440000", "長崎": "420000", "佐賀": "410000", "熊本": "430000",
    "宮崎": "450000", "鹿児島": "460100", "那覇": "471000",
}

# 地点名の読み。検索欄でひらがな・カタカナを受け付けるために使う。
CITY_READINGS = {
    "札幌": "さっぽろ", "青森": "あおもり", "秋田": "あきた", "盛岡": "もりおか",
    "仙台": "せんだい", "山形": "やまがた", "福島": "ふくしま", "水戸": "みと",
    "宇都宮": "うつのみや", "前橋": "まえばし", "熊谷": "くまがや", "東京": "とうきょう",
    "銚子": "ちょうし", "千葉": "ちば", "横浜": "よこはま", "長野": "ながの", "甲府": "こうふ",
    "静岡": "しずおか", "名古屋": "なごや", "岐阜": "ぎふ", "津": "つ",
    "新潟": "にいがた", "富山": "とやま", "金沢": "かなざわ", "福井": "ふくい",
    "彦根": "ひこね", "京都": "きょうと", "大阪": "おおさか", "神戸": "こうべ",
    "奈良": "なら", "和歌山": "わかやま", "岡山": "おかやま", "広島": "ひろしま",
    "松江": "まつえ", "鳥取": "とっとり", "下関": "しものせき", "徳島": "とくしま",
    "高松": "たかまつ", "松山": "まつやま", "高知": "こうち", "福岡": "ふくおか",
    "大分": "おおいた", "長崎": "ながさき", "佐賀": "さが", "熊本": "くまもと",
    "宮崎": "みやざき", "鹿児島": "かごしま", "那覇": "なは",
}

# 環境省の全国47地点にない都市は、同サイトの代表地点のWBGTを表示する。
WBGT_SOURCE_CITY = {"千葉": "銚子"}

# 気象庁の府県コードごとに、環境省の全国47地点で対応する代表地点を割り当てる。
# 市区町村を検索したときのWBGT表示に用いる。
PREFECTURE_WBGT = {
    "01": "札幌", "02": "青森", "03": "盛岡", "04": "仙台", "05": "秋田", "06": "山形", "07": "福島",
    "08": "水戸", "09": "宇都宮", "10": "前橋", "11": "熊谷", "12": "銚子", "13": "東京", "14": "横浜",
    "15": "新潟", "16": "富山", "17": "金沢", "18": "福井", "19": "甲府", "20": "長野", "21": "岐阜",
    "22": "静岡", "23": "名古屋", "24": "津", "25": "彦根", "26": "京都", "27": "大阪", "28": "神戸",
    "29": "奈良", "30": "和歌山", "31": "鳥取", "32": "松江", "33": "岡山", "34": "広島", "35": "下関",
    "36": "徳島", "37": "高松", "38": "松山", "39": "高知", "40": "福岡", "41": "佐賀", "42": "長崎",
    "43": "熊本", "44": "大分", "45": "宮崎", "46": "鹿児島", "47": "那覇",
}
MUNICIPALITIES_LOADED = False


@dataclass
class Weather:
    published: str
    weather: str
    pop: str
    temp_min: str
    temp_max: str


def get_url(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=15) as response:
        return response.read().decode("utf-8")


def wbgt_level(value: float) -> tuple[str, str]:
    if value >= 31:
        return "危険", "#d92027"
    if value >= 28:
        return "厳重警戒", "#f28c28"
    if value >= 25:
        return "警戒", "#f4d03f"
    if value >= 21:
        return "注意", "#52c7d9"
    return "ほぼ安全", "#4186d3"


def normalize_place_name(value: str) -> str:
    """全角半角を揃え、カタカナをひらがなにして地点名検索用に正規化する。"""
    normalized = unicodedata.normalize("NFKC", value).strip()
    return "".join(chr(ord(char) - 0x60) if "ァ" <= char <= "ヶ" else char for char in normalized)


def search_variants(value: str) -> set[str]:
    """市・区・町・村を省いた入力（例: 八王子）も照合できるようにする。"""
    normalized = normalize_place_name(value)
    variants = {normalized, normalized.rstrip("市区町村")}
    for suffix in ("ちょう", "まち", "むら", "そん", "し", "く"):
        if normalized.endswith(suffix):
            variants.add(normalized.removesuffix(suffix))
    return variants


def load_municipalities() -> None:
    """気象庁の地域マスタから市区町村名と対応する府県予報区を読み込む。"""
    global MUNICIPALITIES_LOADED
    if MUNICIPALITIES_LOADED:
        return
    area = json.loads(get_url(JMA_AREA_URL))
    for municipality in area["class20s"].values():
        class15 = area["class15s"].get(municipality.get("parent"))
        if not class15:
            continue
        class10 = area["class10s"].get(class15.get("parent"))
        if not class10:
            continue
        forecast_code = class10.get("parent")
        if not forecast_code:
            continue
        name = municipality["name"]
        # 同名自治体は先に掲載されているものを使う。都道府県を指定する検索は今後追加可能。
        CITY_CODES.setdefault(name, forecast_code)
        CITY_READINGS.setdefault(name, municipality.get("kana", ""))
        WBGT_SOURCE_CITY.setdefault(name, PREFECTURE_WBGT.get(forecast_code[:2], "東京"))
    MUNICIPALITIES_LOADED = True


def local_wbgt() -> dict[str, str]:
    """同梱JSから地点ごとの保存値を読む（オフライン時の予備データ）。"""
    if not LOCAL_WBGT_JS.exists():
        return {}
    text = LOCAL_WBGT_JS.read_text(encoding="utf-8")
    return {name: value for name, value in re.findall(r'\["([^"]+)","([0-9.]+)"', text)}


def fetch_wbgt() -> tuple[dict[str, str], str]:
    html = get_url(ENV_WBGT_URL)
    updated = re.search(r'id="wbgt_monitor_datetime">\s*([^<]+)', html)
    pattern = re.compile(
        r'class="wbgt_monitor_site"[^>]*title="([^"]+)".*?'
        r'<div class="name">.*?</div><div class="value [^"]+">\s*([^<]+)', re.S)
    values = {unescape(name): unescape(value).strip() for name, value in pattern.findall(html)}
    if not values:
        raise ValueError("環境省サイトのWBGT値を読み取れませんでした")
    return values, unescape(updated.group(1)).strip() if updated else "取得時刻不明"


def fetch_weather(code: str, city: str) -> Weather:
    data = json.loads(get_url(JMA_FORECAST_URL.format(code=code)))
    report = data[0]
    series = report["timeSeries"]
    target = next((a for a in series[0]["areas"] if a["area"]["name"] in (city, city + "地方")), series[0]["areas"][0])
    # 気象庁の予報文には読み上げ・表示用の区切り空白が入るため、GUIでは詰めて表示する。
    weather = re.sub(r"[\s　]+", "", target["weathers"][0])
    pop = "--"
    if len(series) > 1:
        pop_target = next((a for a in series[1]["areas"] if a["area"]["name"] == target["area"]["name"]), None)
        if pop_target and pop_target.get("pops"):
            pop = " / ".join(f"{p}%" for p in pop_target["pops"] if p) or "--"
    temps = series[2]["areas"] if len(series) > 2 else []
    temp_target = next((a for a in temps if a["area"]["name"] == city), temps[0] if temps else {})
    temp_values = temp_target.get("temps", [])
    return Weather(report["reportDatetime"], weather, pop, temp_values[0] if temp_values else "--", temp_values[1] if len(temp_values) > 1 else "--")


class Dashboard(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("いまの天気・暑さ指数")
        self.geometry("850x510")
        self.minsize(740, 460)
        self.city = tk.StringVar(value="東京")
        self.city_search = tk.StringVar()
        self.status = tk.StringVar(value="更新を開始します…")
        self.wbgt_value = tk.StringVar(value="--.-")
        self.wbgt_label = tk.StringVar(value="不明")
        self.weather_text = tk.StringVar(value="不明")
        self.pop_text = tk.StringVar(value="降水確率　-% / -% / -% / -% / -%")
        self.temp_text = tk.StringVar(value="予想気温　--℃ / --℃")
        self.updated_text = tk.StringVar(value="")
        self._build()
        self.after(200, self.refresh)
        self._schedule_hourly_refresh()

    def _build(self) -> None:
        style = ttk.Style(self)
        style.configure("Title.TLabel", font=("Yu Gothic UI", 22, "bold"))
        style.configure("Metric.TLabel", font=("Yu Gothic UI", 15))
        root = ttk.Frame(self, padding=24)
        root.pack(fill="both", expand=True)
        top = ttk.Frame(root)
        top.pack(fill="x")
        ttk.Label(top, text="いまの天気・暑さ指数", style="Title.TLabel").pack(side="left")
        city_box = ttk.Combobox(top, textvariable=self.city, values=list(CITY_CODES), state="readonly", width=12)
        city_box.pack(side="right", padx=(8, 0))
        city_box.bind("<<ComboboxSelected>>", lambda _event: self.refresh())
        ttk.Label(top, text="地点名").pack(side="right", padx=(18, 5))
        search_box = ttk.Entry(top, textvariable=self.city_search, width=14)
        search_box.pack(side="right")
        search_box.bind("<Return>", self.search_city)
        ttk.Button(top, text="検索", command=self.search_city).pack(side="right", padx=(5, 0))
        ttk.Button(top, text="更新", command=self.refresh).pack(side="right")

        cards = ttk.Frame(root)
        cards.pack(fill="both", expand=True, pady=22)
        wbgt = tk.Frame(cards, bg="#f3f6fa", padx=24, pady=20)
        wbgt.pack(side="left", fill="both", expand=True, padx=(0, 10))
        tk.Label(wbgt, text="暑さ指数 (WBGT)", bg="#f3f6fa", font=("Yu Gothic UI", 14, "bold")).pack(anchor="w")
        self.wbgt_number = tk.Label(wbgt, textvariable=self.wbgt_value, bg="#f3f6fa", font=("Yu Gothic UI", 52, "bold"))
        self.wbgt_number.pack(anchor="w", pady=(16, 0))
        tk.Label(wbgt, textvariable=self.wbgt_label, bg="#f3f6fa", font=("Yu Gothic UI", 16, "bold")).pack(anchor="w")

        forecast = tk.Frame(cards, bg="#f3f6fa", padx=24, pady=20)
        forecast.pack(side="left", fill="both", expand=True)
        tk.Label(forecast, text="気象庁の予報", bg="#f3f6fa", font=("Yu Gothic UI", 14, "bold")).pack(anchor="w")
        tk.Label(forecast, textvariable=self.weather_text, bg="#f3f6fa", justify="left", wraplength=285, font=("Yu Gothic UI", 12)).pack(anchor="w", pady=(16, 10))
        tk.Label(forecast, textvariable=self.temp_text, bg="#f3f6fa", font=("Yu Gothic UI", 13)).pack(anchor="w", pady=3)
        tk.Label(forecast, textvariable=self.pop_text, bg="#f3f6fa", font=("Yu Gothic UI", 11)).pack(anchor="w", pady=3)

        ttk.Separator(root).pack(fill="x", pady=(0, 12))
        ttk.Label(root, textvariable=self.updated_text).pack(anchor="w")
        ttk.Label(root, textvariable=self.status, foreground="#555555", wraplength=650).pack(anchor="w", pady=(6, 0))

    def refresh(self) -> None:
        self.status.set("最新データを取得中…")
        threading.Thread(target=self._load, daemon=True).start()

    def search_city(self, _event: tk.Event | None = None) -> None:
        query = normalize_place_name(self.city_search.get())
        match = self._find_city(query)
        if not match and query:
            self.status.set("気象庁の市区町村データを読み込んでいます…")
            self.update_idletasks()
            try:
                load_municipalities()
            except Exception as exc:
                messagebox.showerror("取得エラー", f"市区町村データを取得できませんでした。\n{exc}", parent=self)
                return
            match = self._find_city(query)
        if not match:
            messagebox.showerror("検索エラー", "その地名は存在しません。", parent=self)
            return
        self.city.set(match)
        self.city_search.set("")
        self.refresh()

    @staticmethod
    def _find_city(query: str) -> str | None:
        if not query:
            return None
        for name in CITY_CODES:
            candidates = search_variants(name) | search_variants(CITY_READINGS.get(name, ""))
            if query in candidates:
                return name
        return None

    def _schedule_hourly_refresh(self) -> None:
        """次の毎時0分に更新し、その後も1時間おきに繰り返す。"""
        # Windows版PythonではIANAタイムゾーンデータ(tzdata)が別途必要な場合がある。
        # 日本時間は夏時間がないため、固定UTC+9なら追加パッケージなしで正確に扱える。
        now = datetime.now(JST)
        next_hour = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
        delay_ms = max(1, int((next_hour - now).total_seconds() * 1000))
        self.after(delay_ms, self._hourly_refresh)

    def _hourly_refresh(self) -> None:
        self.refresh()
        self._schedule_hourly_refresh()

    def _load(self) -> None:
        city = self.city.get()
        messages: list[str] = []
        try:
            wbgt, wbgt_time = fetch_wbgt()
            source = f"環境省: {wbgt_time}"
        except Exception as exc:
            wbgt, source = local_wbgt(), "環境省の取得に失敗。保存済みJSを表示"
            messages.append(f"WBGT: {exc}")
        try:
            weather = fetch_weather(CITY_CODES[city], city)
        except Exception as exc:
            weather = None
            messages.append(f"予報: {exc}")
        self.after(0, self._show, city, wbgt, source, weather, messages)

    def _show(self, city: str, wbgt: dict[str, str], source: str, weather: Weather | None, messages: list[str]) -> None:
        wbgt_city = WBGT_SOURCE_CITY.get(city, city)
        raw = wbgt.get(wbgt_city, "--.-")
        self.wbgt_value.set(raw)
        try:
            level, color = wbgt_level(float(raw))
            self.wbgt_label.set(f"{level}（{wbgt_city}）" if wbgt_city != city else level)
            self.wbgt_number.configure(fg=color)
        except ValueError:
            self.wbgt_label.set("不明")
            self.wbgt_number.configure(fg="#555555")
        if weather:
            self.weather_text.set(weather.weather)
            self.temp_text.set(f"予想気温　{weather.temp_min}℃ / {weather.temp_max}℃")
            self.pop_text.set(f"降水確率　{weather.pop}")
            source += f"　｜　気象庁: {weather.published}"
        else:
            self.weather_text.set("不明")
            self.temp_text.set("予想気温　--℃ / --℃")
            self.pop_text.set("降水確率　-% / -% / -% / -% / -%")
        self.updated_text.set(source)
        self.status.set("更新完了" if not messages else " / ".join(messages))


if __name__ == "__main__":
    Dashboard().mainloop()
