"use strict";

const JMA_FORECAST_URL = "https://www.jma.go.jp/bosai/forecast/data/forecast/";
const JMA_AREA_URL = "https://www.jma.go.jp/bosai/common/const/area.json";
// GitHubのblobページではなく、同じファイルをそのまま返すraw配信URL。
const WBGT_URL = "https://raw.githubusercontent.com/marimutukisinnmu-rgb/Weather-app/main/docs/top_tooltip_td.js";

const cityCodes = {
  "札幌":"016000","青森":"020000","秋田":"050000","盛岡":"030000","仙台":"040000","山形":"060000","福島":"070000","水戸":"080000","宇都宮":"090000","前橋":"100000","熊谷":"110000","東京":"130000","銚子":"120000","千葉":"120000","横浜":"140000","長野":"200000","甲府":"190000","静岡":"220000","名古屋":"230000","岐阜":"210000","津":"240000","新潟":"150000","富山":"160000","金沢":"170000","福井":"180000","彦根":"250000","京都":"260000","大阪":"270000","神戸":"280000","奈良":"290000","和歌山":"300000","岡山":"330000","広島":"340000","松江":"320000","鳥取":"310000","下関":"350000","徳島":"360000","高松":"370000","松山":"380000","高知":"390000","福岡":"400000","大分":"440000","長崎":"420000","佐賀":"410000","熊本":"430000","宮崎":"450000","鹿児島":"460100","那覇":"471000"
};
const readings = {"札幌":"さっぽろ","青森":"あおもり","秋田":"あきた","盛岡":"もりおか","仙台":"せんだい","山形":"やまがた","福島":"ふくしま","水戸":"みと","宇都宮":"うつのみや","前橋":"まえばし","熊谷":"くまがや","東京":"とうきょう","銚子":"ちょうし","千葉":"ちば","横浜":"よこはま","長野":"ながの","甲府":"こうふ","静岡":"しずおか","名古屋":"なごや","岐阜":"ぎふ","津":"つ","新潟":"にいがた","富山":"とやま","金沢":"かなざわ","福井":"ふくい","彦根":"ひこね","京都":"きょうと","大阪":"おおさか","神戸":"こうべ","奈良":"なら","和歌山":"わかやま","岡山":"おかやま","広島":"ひろしま","松江":"まつえ","鳥取":"とっとり","下関":"しものせき","徳島":"とくしま","高松":"たかまつ","松山":"まつやま","高知":"こうち","福岡":"ふくおか","大分":"おおいた","長崎":"ながさき","佐賀":"さが","熊本":"くまもと","宮崎":"みやざき","鹿児島":"かごしま","那覇":"なは"};
const prefectureWbgt = {"01":"札幌","02":"青森","03":"盛岡","04":"仙台","05":"秋田","06":"山形","07":"福島","08":"水戸","09":"宇都宮","10":"前橋","11":"熊谷","12":"銚子","13":"東京","14":"横浜","15":"新潟","16":"富山","17":"金沢","18":"福井","19":"甲府","20":"長野","21":"岐阜","22":"静岡","23":"名古屋","24":"津","25":"彦根","26":"京都","27":"大阪","28":"神戸","29":"奈良","30":"和歌山","31":"鳥取","32":"松江","33":"岡山","34":"広島","35":"下関","36":"徳島","37":"高松","38":"松山","39":"高知","40":"福岡","41":"佐賀","42":"長崎","43":"熊本","44":"大分","45":"宮崎","46":"鹿児島","47":"那覇"};
const wbgtSource = { "千葉": "銚子" };
let municipalitiesLoaded = false;

const $ = (id) => document.getElementById(id);
const citySelect = $("city");
const status = $("status");
const source = $("source");

function normalize(value) {
  return value.normalize("NFKC").trim().replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60));
}
function variants(value) {
  const text = normalize(value);
  const result = new Set([text, text.replace(/[市区町村]$/, "")]);
  ["ちょう", "まち", "むら", "そん", "し", "く"].forEach(suffix => { if (text.endsWith(suffix)) result.add(text.slice(0, -suffix.length)); });
  return result;
}
function populateCities(selected = citySelect.value || "東京") {
  citySelect.replaceChildren(...Object.keys(cityCodes).map(name => new Option(name, name, false, name === selected)));
}
function findCity(query) {
  if (!query) return null;
  return Object.keys(cityCodes).find(name => {
    const choices = new Set([...variants(name), ...variants(readings[name] || "")]);
    return choices.has(query);
  }) || null;
}
function levelOf(value) {
  if (value >= 31) return ["危険", "danger"];
  if (value >= 28) return ["厳重警戒", "severe"];
  if (value >= 25) return ["警戒", "warning"];
  if (value >= 21) return ["注意", "caution"];
  return ["ほぼ安全", "safe"];
}
function setUnknownWbgt() {
  $("wbgt-value").textContent = "--.-";
  $("wbgt-level").textContent = "不明";
  $("wbgt-level").className = "level unknown";
  $("wbgt-place").textContent = "";
}
function setUnknownWeather() {
  $("weather").textContent = "不明";
  $("temperature").textContent = "予想気温　--℃ / --℃";
  $("pop").textContent = "降水確率　-% / -% / -% / -% / -%";
}
async function fetchWbgt() {
  const text = await (await fetch(WBGT_URL, { cache: "no-store" })).text();
  // 配布元の公開JSは `var top_tooltip_td = {...};` という形式。
  const data = new Function(`${text}; return top_tooltip_td;`)();
  const values = new Map();
  Object.values(data).flat().forEach(row => values.set(row[0], row[1]));
  // GitHub Actionsが末尾に残す更新日時も、WBGTデータの時刻として表示する。
  const updated = text.match(/\/\/\s*Updated by GitHub Actions:\s*(.+?)\s*$/m)?.[1] || "更新時刻不明";
  return { values, updated };
}
async function fetchWeather(city) {
  const report = await (await fetch(`${JMA_FORECAST_URL}${cityCodes[city]}.json`, { cache: "no-store" })).json();
  const series = report[0].timeSeries;
  const areas = series[0].areas;
  const target = areas.find(area => [city, `${city}地方`].includes(area.area.name)) || areas[0];
  const weather = (target.weathers[0] || "不明").replace(/[\s　]+/g, "");
  const popArea = series[1]?.areas.find(area => area.area.name === target.area.name);
  const pop = popArea?.pops?.filter(Boolean).map(value => `${value}%`).join(" / ") || "-% / -% / -% / -% / -%";
  const tempAreas = series[2]?.areas || [];
  const tempArea = tempAreas.find(area => area.area.name === city) || tempAreas[0];
  const temps = tempArea?.temps || [];
  return { weather, pop, min: temps[0] || "--", max: temps[1] || "--", published: report[0].reportDatetime };
}
async function loadMunicipalities() {
  if (municipalitiesLoaded) return;
  const area = await (await fetch(JMA_AREA_URL)).json();
  Object.values(area.class20s).forEach(municipality => {
    const class15 = area.class15s[municipality.parent];
    const class10 = class15 && area.class10s[class15.parent];
    const code = class10?.parent;
    if (!code || cityCodes[municipality.name]) return;
    cityCodes[municipality.name] = code;
    readings[municipality.name] = municipality.kana || "";
    wbgtSource[municipality.name] = prefectureWbgt[code.slice(0, 2)] || "東京";
  });
  municipalitiesLoaded = true;
  populateCities();
}
async function refresh() {
  const city = citySelect.value;
  status.textContent = "最新データを取得中…";
  setUnknownWbgt(); setUnknownWeather();
  const results = await Promise.allSettled([fetchWbgt(), fetchWeather(city)]);
  const messages = [];
  let wbgtUpdated = "更新時刻不明";
  if (results[0].status === "fulfilled") {
    const wbgtCity = wbgtSource[city] || city;
    const { values, updated } = results[0].value;
    wbgtUpdated = updated;
    const raw = values.get(wbgtCity);
    if (raw && !Number.isNaN(Number(raw))) {
      const [label, className] = levelOf(Number(raw));
      $("wbgt-value").textContent = raw;
      $("wbgt-level").textContent = label;
      $("wbgt-level").className = `level ${className}`;
      $("wbgt-place").textContent = wbgtCity === city ? "" : `WBGTは${wbgtCity}地点の値です`;
    } else messages.push("WBGT地点の値が見つかりません");
  } else messages.push("WBGTを取得できませんでした");
  if (results[1].status === "fulfilled") {
    const weather = results[1].value;
    $("weather").textContent = weather.weather;
    $("temperature").textContent = `予想気温　${weather.min}℃ / ${weather.max}℃`;
    $("pop").textContent = `降水確率　${weather.pop}`;
    source.textContent = `WBGT: ${wbgtUpdated}　｜　気象庁: ${weather.published}`;
  } else {
    source.textContent = `WBGT: ${wbgtUpdated}　｜　気象庁の予報を取得できませんでした`;
    messages.push("気象庁の予報を取得できませんでした");
  }
  status.textContent = messages.length ? messages.join("　/　") : "更新完了";
}
function scheduleHourlyRefresh() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  setTimeout(() => { refresh(); scheduleHourlyRefresh(); }, Math.max(1, next - now));
}
function showError(message) {
  $("error-message").textContent = message;
  $("error-dialog").showModal();
}

populateCities();
citySelect.addEventListener("change", refresh);
$("refresh").addEventListener("click", refresh);
$("search-form").addEventListener("submit", async event => {
  event.preventDefault();
  const field = $("place-search");
  const query = normalize(field.value);
  let city = findCity(query);
  if (!city && query) {
    status.textContent = "気象庁の市区町村データを読み込んでいます…";
    try { await loadMunicipalities(); city = findCity(query); }
    catch { showError("市区町村データを取得できませんでした。"); return; }
  }
  if (!city) { showError("その地名は存在しません。"); return; }
  citySelect.value = city;
  field.value = "";
  refresh();
});
refresh();
scheduleHourlyRefresh();
