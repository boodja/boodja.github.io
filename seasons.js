// seasons.js — Six-season calendar (Noongar / Bardi / Yawuru)
// Data source: data/seasonal-calendar.json (WAITOC brochure)
// Intended to back the planned wildlife.html / wildlife.json seasonal-awareness page,
// and to let the bushfood layer flag "in season now" tours/products.

let seasonalCalendar = null;

function loadSeasonalCalendar() {
  return fetch('data/seasonal-calendar.json')
    .then(res => res.json())
    .then(data => { seasonalCalendar = data; return data; })
    .catch(err => { console.error('Failed to load seasonal calendar:', err); return null; });
}

// Returns the season object active for a given calendar-system key ("noongar" | "bardi" | "yawuru")
// at a given Date (defaults to now).
function getCurrentSeason(systemKey, date = new Date()) {
  if (!seasonalCalendar || !seasonalCalendar[systemKey]) return null;
  const month = date.getMonth() + 1; // JS months are 0-indexed
  return seasonalCalendar[systemKey].seasons.find(s => s.months.includes(month)) || null;
}

// Given a region_code (KIM, PIL, CC, GF, WB, SW, PER) pick the relevant season system(s).
// Kimberley/Pilbara/Coral Coast lean Bardi/Yawuru; South West/Wheatbelt/Perth lean Noongar.
function getSeasonForRegion(regionCode, date = new Date()) {
  if (!seasonalCalendar) return [];
  return Object.entries(seasonalCalendar)
    .filter(([, sys]) => sys.region_codes.includes(regionCode))
    .map(([key, sys]) => ({
      system: sys.label,
      season: getCurrentSeason(key, date)
    }))
    .filter(entry => entry.season);
}

// Example use inside buildBushfoodPopup() in bushfood.js:
//   const seasonInfo = getSeasonForRegion(p.region_code);
//   const seasonLine = seasonInfo.map(s => `${s.system}: ${s.season.name} — ${s.season.desc}`).join('<br>');

window.loadSeasonalCalendar = loadSeasonalCalendar;
window.getCurrentSeason = getCurrentSeason;
window.getSeasonForRegion = getSeasonForRegion;
