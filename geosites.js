let geositeMarkers = [];
let geositesActive = false;
let geositesData = null;

function toggleGeosites() {
    const btn = document.getElementById('btn-geosites');
    if (geositesActive) {
        geositeMarkers.forEach(function(m) { map.removeLayer(m); });
        geositeMarkers = [];
        geositesActive = false;
        btn.classList.remove('active');
    } else {
        geositesActive = true;
        btn.classList.add('active');
        if (geositesData) {
            renderGeosites();
        } else {
            fetch('geosites.geojson')
                .then(r => r.json())
                .then(function(data) { geositesData = data; renderGeosites(); })
                .catch(function(err) { console.log('GeoSites error:', err); });
        }
    }
}

function renderGeosites() {
    geositesData.features.forEach(function(f) {
        const p = f.properties;
        const pinColor = p.color || '#8B6347';
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

// Expose functions to global scope for inline HTML onclick handlers

function toggleFilterSheet() {
