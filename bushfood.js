// bushfood.js — Bushfood & Wildflower Trails layer
// Load order: after geosites.js, before ui.js (same pattern as other GeoJSON layers)
// Data source: bushfood-wildflower-trails.geojson (WAITOC brochure, 56 operators)

const BUSHFOOD_REGION_COLOURS = {
  KIM: '#c0392b', // Kimberley
  PIL: '#8e44ad', // Pilbara
  CC:  '#2980b9', // Coral Coast
  GF:  '#7f8c8d', // Goldfields
  WB:  '#d35400', // Wheatbelt
  SW:  '#27ae60', // South West
  PER: '#f39c12'  // Perth / Fremantle / Peel
};

let bushfoodLayer = null;

function buildBushfoodPopup(feature) {
  const p = feature.properties;
  const highlights = (p.highlights || []).map(h => `• ${h}`).join('<br>');
  const contact = p.contact || {};
  const phone = contact.phone ? `📞 ${contact.phone}<br>` : '';
  const site = contact.website
    ? `<a href="https://${contact.website.replace(/^https?:\/\//, '')}" target="_blank" rel="noopener">${contact.website}</a>`
    : '';
  const badge = p.category === 'product' ? 'Native Foods / Bush Remedies' : 'Bushfood & Wildflower Tour';

  let seasonLine = '';
  if (typeof getSeasonForRegion === 'function') {
    const seasonInfo = getSeasonForRegion(p.region_code);
    if (seasonInfo.length) {
      seasonLine = `<div class="season">${seasonInfo
        .map(s => `Now: ${s.season.name} (${s.system})`)
        .join('<br>')}</div>`;
    }
  }

  return `
    <div class="bushfood-popup">
      <h3>${p.name}</h3>
      <div class="badge">${badge}</div>
      <div class="location">${p.location}</div>
      ${highlights ? `<div class="highlights">${highlights}</div>` : ''}
      ${seasonLine}
      ${phone}${site}
    </div>
  `;
}

function loadBushfoodLayer(map) {
  const dot = document.getElementById('btn-bushfood');

  // Kick off the seasonal calendar fetch in parallel — don't wait on the bushfood
  // fetch to finish first, so it's ready (or close to it) by the time a popup opens.
  if (!seasonalCalendar && typeof loadSeasonalCalendar === 'function') {
    loadSeasonalCalendar();
  }

  fetch('bushfood-wildflower-trails.geojson')
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' fetching bushfood-wildflower-trails.geojson');
      return res.json();
    })
    .then(data => {
      bushfoodLayer = L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
          const colour = BUSHFOOD_REGION_COLOURS[feature.properties.region_code] || '#555';
          return L.circleMarker(latlng, {
            radius: 7,
            fillColor: colour,
            color: '#fff',
            weight: 1,
            fillOpacity: 0.9
          });
        },
        onEachFeature: (feature, layer) => {
          // Bound as a function, not a pre-built string: Leaflet calls this fresh
          // each time the popup opens, so it always reflects the current
          // (by-then-loaded) seasonalCalendar rather than whatever was true
          // the instant the layer was constructed.
          layer.bindPopup(() => buildBushfoodPopup(feature));
        }
      });
      bushfoodLayer.addTo(map);
      if (dot) dot.classList.add('active');
    })
    .catch(err => {
      console.error('Failed to load bushfood layer:', err);
      if (dot) dot.classList.remove('active');
      alert('Bushfood layer failed to load — check that bushfood-wildflower-trails.geojson is at the right path (see console for details).');
    });
}

// Toggle on/off — matches the pattern of toggleLighthouses / toggleAboriginal in ui.js's export block.
// First tap: fetches and adds the layer (dot lights up only once the fetch actually succeeds).
// Subsequent taps: just show/hide it (no re-fetch).
function toggleBushfoodTours() {
    const dot = document.getElementById('btn-bushfood');
    if (!bushfoodLayer) {
        loadBushfoodLayer(map);
        return;
    }
    if (map.hasLayer(bushfoodLayer)) {
        map.removeLayer(bushfoodLayer);
        if (dot) dot.classList.remove('active');
    } else {
        bushfoodLayer.addTo(map);
        if (dot) dot.classList.add('active');
    }
}

// Filter helper — matches the per-category filtering pattern in geosites.js
function filterBushfoodByCategory(category) {
  if (!bushfoodLayer) return;
  bushfoodLayer.eachLayer(layer => {
    const match = category === 'all' || layer.feature.properties.category === category;
    layer.setStyle({ opacity: match ? 1 : 0, fillOpacity: match ? 0.9 : 0 });
  });
}

// Exports (deferred pattern, consistent with ui.js window-export convention)
window.loadBushfoodLayer = loadBushfoodLayer;
window.filterBushfoodByCategory = filterBushfoodByCategory;
