// Lighthouse layer
let lighthouseMarkers = [];
let lighthousesActive = false;
let lighthouseData = null;

function toggleLighthouses() {
    const btn = document.getElementById('btn-lighthouses');
    if (lighthousesActive) {
        lighthouseMarkers.forEach(m => map.removeLayer(m));
        lighthouseMarkers = [];
        lighthousesActive = false;
        btn.classList.remove('active');
    } else {
        lighthousesActive = true;
        btn.classList.add('active');
        if (lighthouseData) {
            renderLighthouses();
        } else {
            fetch('lighthouses.geojson')
                .then(r => r.json())
                .then(data => { lighthouseData = data; renderLighthouses(); })
                .catch(function() { console.log('Could not load lighthouse data'); });
        }
    }
}

function renderLighthouses() {
    lighthouseData.features.forEach(function(f) {
        const p = f.properties;
        const icon = L.divIcon({
            html: '<div style="width:14px;height:14px;background:#f5c518;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>',
            className: '',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });
        const marker = L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]], { icon }).addTo(map);
        const lhLat = f.geometry.coordinates[1];
        const lhLng = f.geometry.coordinates[0];
        marker.bindPopup(
            '<b>' +p.name + '</b><br>' +
            '<small>Established ' + p.established + '</small><br><br>' +
            (p.construction ? 'Construction: ' + p.construction + '<br>' : '') +
            (p.height ? 'Height: ' + p.height + '<br>' : '') +
            'Status: ' + p.status + '<br>' +
            (p.access ? 'Access: ' + p.access + '<br>' : '') +
            (p.remarks ? '<br><small>' + p.remarks + '</small>' : '') +
            makeNavButton(lhLat, lhLng)
        );
        lighthouseMarkers.push(marker);
    });
}

// ── Trail layers (walk, 2x2, paddle) ──
