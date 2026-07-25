// ── Filter sheet ──
function toggleFilterSheet() {
    const sheet = document.getElementById('filter-sheet');
    const isOpen = sheet.style.display === 'block';
    sheet.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) {
        closeDrawer();
        closeAddPinChooser();
        closeLayerSearch();
    }
}

function closeFilterSheet() {
    const sheet = document.getElementById('filter-sheet');
    if (sheet) sheet.style.display = 'none';
}

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
