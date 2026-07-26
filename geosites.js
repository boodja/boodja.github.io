// ── GeoSites layer — filterable by category ──
const GEOSITE_CATEGORIES = {
    shells:    { color: '#1a6dd8',  label: 'Shells',          btnId: 'btn-shells' },
    gems:      { color: '#c2185b',  label: 'Gems & Minerals', btnId: 'btn-gems' },
    caves:     { color: '#1a6b5c',  label: 'Caves',           btnId: 'btn-caves' },
    fossils:   { color: '#8B6347',  label: 'Fossils',         btnId: 'btn-geosites' },
    meteorites:{ color: '#546e7a',  label: 'Meteorites',      btnId: 'btn-meteorites' }
};

let geositeMarkers = [];
let geositesData = null;
let activeGeoCategories = new Set();

function toggleGeosites(category) {
    // If no category passed, toggle all (backwards compat)
    if (!category) category = 'fossils';

    const cat = GEOSITE_CATEGORIES[category];
    if (!cat) return;

    const btn = document.getElementById(cat.btnId);

    if (activeGeoCategories.has(category)) {
        // Turn off this category
        activeGeoCategories.delete(category);
        if (btn) btn.classList.remove('active');
    } else {
        // Turn on this category
        activeGeoCategories.add(category);
        if (btn) btn.classList.add('active');
    }

    // Remove all current markers and re-render active categories
    geositeMarkers.forEach(function(m) { map.removeLayer(m); });
    geositeMarkers = [];

    if (activeGeoCategories.size === 0) return;

    if (geositesData) {
        renderGeosites();
    } else {
        fetch('geosites.geojson')
            .then(r => r.json())
            .then(function(data) { geositesData = data; renderGeosites(); })
            .catch(function(err) { console.log('GeoSites error:', err); });
    }
}

function renderGeosites() {
    // Build set of active colors
    const activeColors = new Set();
    activeGeoCategories.forEach(function(cat) {
        activeColors.add(GEOSITE_CATEGORIES[cat].color);
    });

    geositesData.features.forEach(function(f) {
        const p = f.properties;
        const pinColor = p.color || '#8B6347';

        // Only show if this pin's color matches an active category
        if (!activeColors.has(pinColor)) return;

        const icon = L.divIcon({
            html: '<div style="width:14px;height:14px;background:' + pinColor + ';border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>',
            className: '',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });
        const marker = L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]], { icon }).addTo(map);
        const popupDiv = document.createElement('div');
        popupDiv.style.minWidth = '240px';
        popupDiv.innerHTML =
            '<b>' + p.name + '</b><br>' +
            '<small style="color:' + pinColor + ';"><b>' + p.type + '</b></small><br><br>' +
            (p.location ? '<b>Location:</b> ' + p.location + '<br>' : '') +
            (p.access ? '<b>Access:</b> ' + p.access + '<br>' : '') +
            (p.comment ? '<br>' + p.comment : '') +
            (p.wam_url ? '<br><br><a href="' + p.wam_url + '" target="_blank" style="color:#1a7abf;font-size:12px;">🏛 View WAM type specimen</a>' : '') +
            makeNavButton(f.geometry.coordinates[1], f.geometry.coordinates[0]);
        marker.bindPopup(popupDiv);
        geositeMarkers.push(marker);
    });
}
