// ── Three filter sheets ──
function toggleSheet(id) {
    const sheets = ['sheet-travel', 'sheet-tracks', 'sheet-geo'];
    const btns = { 'sheet-travel': 'menu-btn-travel', 'sheet-tracks': 'menu-btn-tracks', 'sheet-geo': 'menu-btn-geo' };
    const sheet = document.getElementById(id);
    const isOpen = sheet.style.display === 'block';

    // Close all sheets and deactivate all buttons
    sheets.forEach(function(s) {
        document.getElementById(s).style.display = 'none';
        const btn = document.getElementById(btns[s]);
        if (btn) btn.classList.remove('active');
    });

    // Open this one if it was closed
    if (!isOpen) {
        sheet.style.display = 'block';
        const btn = document.getElementById(btns[id]);
        if (btn) btn.classList.add('active');
        closeDrawer();
        closeAddPinChooser();
        closeLayerSearch();
    }
}

function closeAllSheets() {
    ['sheet-travel', 'sheet-tracks', 'sheet-geo'].forEach(function(s) {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });
    ['menu-btn-travel', 'menu-btn-tracks', 'menu-btn-geo'].forEach(function(b) {
        const el = document.getElementById(b);
        if (el) el.classList.remove('active');
    });
}

// Keep old names working
function toggleFilterSheet() { toggleSheet('sheet-travel'); }
function closeFilterSheet() { closeAllSheets(); }

// ── Global exports ──
window.savePin = savePin;
window.cancelPin = cancelPin;
window.editPin = editPin;
window.deletePin = deletePin;
window.speakPin = speakPin;
window.toggleDFES = toggleDFES;
window.toggleWACamps = toggleWACamps;
window.toggleFuel = toggleFuel;
window.toggleWater = toggleWater;
window.toggleLighthouses = toggleLighthouses;
window.toggleAboriginal = toggleAboriginal;
window.toggleCaves = toggleGeosites;
window.toggleFossils = toggleGeosites;
window.toggleGeosites = toggleGeosites;
window.toggle2x2 = toggle2x2;
window.show2x2Route = show2x2Route;
window.toggleTrailLayer = toggleTrailLayer;
window.toggleFilterSheet = toggleFilterSheet;
window.closeFilterSheet = closeFilterSheet;
window.toggleSheet = toggleSheet;
window.closeAllSheets = closeAllSheets;
window.setMapLayer = setMapLayer;
window.togglePanel = function() {};
window.openNature = openNature;
window.toggleAddPinChooser = toggleAddPinChooser;
window.closeAddPinChooser = closeAddPinChooser;
window.addPinFromGPS = addPinFromGPS;
window.toggleAddressSearch = toggleAddressSearch;
window.addPinFromMap = addPinFromMap;
window.toggleDrawer = toggleDrawer;
window.closeDrawer = closeDrawer;
window.toggleSection = toggleSection;
window.toggleProximityMute = toggleProximityMute;
