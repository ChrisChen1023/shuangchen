// Bilingual text helpers shared by the renderers. English is the baseline; Chinese copies sit beside it in the HTML
// and the stylesheet shows one language at a time (site.css, "Language"), so the page reads in English without JavaScript.
export const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

// Both arguments are already-escaped HTML fragments. Without a Chinese copy the English text is emitted unwrapped.
export const pair = (en, zh) => zh ? `<span class="l10n" lang="en">${en}</span><span class="l10n" lang="zh-Hans">${zh}</span>` : en;

// Convenience for plain text values straight from the data files.
export const text = (en, zh) => pair(escape(en), zh ? escape(zh) : '');

// Chinese date label such as 2026年10月2日 from an ISO date.
export const zhDate = iso => { const [year, month, day] = iso.split('-').map(Number); return `${year}年${month}月${day}日`; };
export const zhMonth = iso => { const [year, month] = iso.split('-').map(Number); return `${year}年${month}月`; };
