// =========================================
// Lieferung Form Logic - Neu implementiert
// =========================================

// Globale Variablen
let palettenDaten = [];
const GEBINDE_PRO_PALETTE = 56;

// Sofort nach DOM-Load ausführen
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM geladen - starte Initialisierung');

    // Event-Listener für Gebinde-Felder
    const ersteGebinde = document.getElementById('erste_gebinde');
    const letzteGebinde = document.getElementById('letzte_gebinde');

    if (ersteGebinde && letzteGebinde) {
        console.log('Gebinde-Felder gefunden - setze Event-Listener');

        ersteGebinde.addEventListener('input', function () {
            console.log('🔄 Erste Gebinde geändert:', this.value);
            setTimeout(() => berechnePaletten(), 10); // Kurze Verzögerung für bessere Performance
        });

        letzteGebinde.addEventListener('input', function () {
            console.log('🔄 Letzte Gebinde geändert:', this.value);
            setTimeout(() => berechnePaletten(), 10); // Kurze Verzögerung für bessere Performance
        });

        // Notizen-Feld neutral halten (nie validieren)
        const notizen = document.getElementById('notizen');
        if (notizen) {
            // Entferne required-Attribut falls vorhanden
            notizen.removeAttribute('required');

            notizen.addEventListener('focus', function () {
                this.classList.remove('is-valid', 'is-invalid');
            });
            notizen.addEventListener('input', function () {
                this.classList.remove('is-valid', 'is-invalid');
            });
            notizen.addEventListener('blur', function () {
                this.classList.remove('is-valid', 'is-invalid');
            });

            console.log('Notizen-Feld für neutrale Validierung konfiguriert');
        }

        console.log('Event-Listener erfolgreich gesetzt');
    } else {
        console.error('Gebinde-Felder nicht gefunden!');
    }

    // Button Event-Listener mit Debug-Ausgaben
    // --- Neu ---
    const btnNeu = document.getElementById('btnNeu');
    if (btnNeu) {
        btnNeu.addEventListener('click', function () {
            const form = document.getElementById('lieferungForm');
            if (!form) return;
            if (form.querySelector('[required]') && isModified()) {
                if (!confirm('Ungespeicherte Änderungen gehen verloren. Fortfahren?')) return;
            }
            form.reset();
            form.classList.remove('was-validated');
            palettenDaten = [];
            versteckePalettenUebersicht();
            // Pflichtfelder wieder rot markieren
            form.querySelectorAll('[required]').forEach(f => {
                f.classList.remove('is-valid');
                f.classList.add('is-invalid');
            });
            document.getElementById('lieferscheinnummer')?.focus();
        });
    }

    // --- Speichern ---
    const btnSpeichern = document.getElementById('btnSpeichern');
    if (btnSpeichern) {
        btnSpeichern.addEventListener('click', function () {
            const form = document.getElementById('lieferungForm');
            if (!form) return;
            form.classList.add('was-validated');
            if (!form.checkValidity()) {
                form.querySelector(':invalid')?.focus();
                return;
            }
            // Daten als JSON in localStorage sichern (Offline-Speicherung)
            const data = getFormData();
            const key = 'lieferung_' + (data.lieferscheinnummer || Date.now());
            localStorage.setItem(key, JSON.stringify(data));
            alert('Datensatz gespeichert:\n' + key);
        });
    }

    // --- Löschen ---
    const btnLoeschen = document.getElementById('btnLoeschen');
    if (btnLoeschen) {
        btnLoeschen.addEventListener('click', function () {
            const form = document.getElementById('lieferungForm');
            if (!form) return;
            const lsnr = document.getElementById('lieferscheinnummer')?.value;
            if (!lsnr) {
                alert('Kein Datensatz geladen.');
                return;
            }
            if (!confirm('Datensatz "' + lsnr + '" wirklich löschen?')) return;
            localStorage.removeItem('lieferung_' + lsnr);
            form.reset();
            form.classList.remove('was-validated');
            palettenDaten = [];
            versteckePalettenUebersicht();
            alert('Datensatz gelöscht.');
        });
    }

    const btnPalettenetiketten = document.getElementById('btnPalettenetiketten');
    const btnPalettenPackliste = document.getElementById('btnPalettenPackliste');

    if (btnPalettenetiketten) {
        btnPalettenetiketten.addEventListener('click', function () {
            console.log('📋 Palettenetiketten-Button geklickt');
            palettenetikettenAusdruck();
        });
        console.log('✅ Palettenetiketten-Button Event-Listener gesetzt');
    } else {
        console.error('❌ Palettenetiketten-Button nicht gefunden!');
    }

    if (btnPalettenPackliste) {
        btnPalettenPackliste.addEventListener('click', function () {
            console.log('📋 Packliste-Button geklickt');
            palettenPacklisteAusdruck();
        });
        console.log('✅ Packliste-Button Event-Listener gesetzt');
    } else {
        console.error('❌ Packliste-Button nicht gefunden!');
    }

    // Form Submit Handler - VERHINDERT Formular-Reset
    const form = document.getElementById('lieferungForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            // IMMER verhindern, dass das Formular abgesendet wird
            e.preventDefault();
            e.stopPropagation();

            console.log('💾 Speichern-Button geklickt');

            // Bootstrap-Validierung aktivieren
            form.classList.add('was-validated');

            // Prüfe ob Formular gültig ist
            if (!form.checkValidity()) {
                console.log('❌ Formular ungültig - kann nicht gespeichert werden');

                // Fokus auf erstes ungültiges Feld setzen
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                    console.log('🎯 Fokus auf ungültiges Feld:', firstInvalid.id);
                }

                alert('Bitte füllen Sie alle Pflichtfelder aus!');
                return false;
            }

            // Formular ist gültig - simuliere Speicherung
            console.log('✅ Formular gültig - simuliere Speicherung');

            // Sammle Formular-Daten
            const formData = {
                lieferdatum: document.getElementById('lieferdatum').value,
                lieferscheinnummer: document.getElementById('lieferscheinnummer').value,
                abnehmer: document.getElementById('abnehmer').value,
                ersteGebinde: document.getElementById('erste_gebinde').value,
                letzteGebinde: document.getElementById('letzte_gebinde').value,
                anzahlGebinde: document.getElementById('anzahl_gebinde').value,
                anzahlPaletten: document.getElementById('anzahl_paletten').value,
                notizen: document.getElementById('notizen').value,
                zeitstempel: new Date().toLocaleString('de-DE')
            };

            console.log('📁 Zu speichernde Daten:', formData);

            // Simuliere erfolgreiche Speicherung
            alert('✅ Daten erfolgreich gespeichert!\n\nLieferschein: ' + formData.lieferscheinnummer + '\nPaletten: ' + formData.anzahlPaletten);

            // Update Last-Saved Zeit
            const now = new Date();
            const timeString = now.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            });
            document.getElementById('lastSaved').textContent = timeString;

            return false; // Immer false, damit nichts resettet wird
        });

        // Validierung auch bei Input-Events aktivieren
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('input', function () {
                if (this.checkValidity()) {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                } else {
                    this.classList.remove('is-valid');
                    this.classList.add('is-invalid');
                }
            });

            field.addEventListener('blur', function () {
                if (form.classList.contains('was-validated')) {
                    if (this.checkValidity()) {
                        this.classList.remove('is-invalid');
                        this.classList.add('is-valid');
                    } else {
                        this.classList.remove('is-valid');
                        this.classList.add('is-invalid');
                    }
                }
            });
        });
    }

    console.log('Initialisierung abgeschlossen');

    // Initiale Validierung aktivieren für sofortige Anzeige roter Rahmen bei leeren Pflichtfeldern
    setTimeout(() => {
        const form = document.getElementById('lieferungForm');
        if (form) {
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim() && field.id !== 'notizen') {
                    field.classList.add('is-invalid');
                }
            });
            console.log('Initiale Validierung für Pflichtfelder gesetzt');
        }
    }, 200);

    // Test-Funktionen für Debugging
    window.testValidierung = function () {
        console.log('=== Validierungs-Test ===');
        const form = document.getElementById('lieferungForm');
        if (form) {
            form.classList.add('was-validated');
            const isValid = form.checkValidity();
            console.log('Formular gültig:', isValid);

            const invalidFields = form.querySelectorAll(':invalid');
            console.log('Ungültige Felder:', invalidFields.length);
            invalidFields.forEach(field => {
                console.log('- Ungültig:', field.id, field.validationMessage);
            });
        }
    };

    // Test-Funktion für Berechnung
    window.testBerechnung = function () {
        console.log('=== 🧮 Berechnungs-Test ===');
        document.getElementById('erste_gebinde').value = 'G-0001';
        document.getElementById('letzte_gebinde').value = 'G-0112';
        berechnePaletten();
        console.log('📈 Anzahl Gebinde:', document.getElementById('anzahl_gebinde').value);
        console.log('📦 Anzahl Paletten:', document.getElementById('anzahl_paletten').value);
        console.log('📋 Paletten-Daten:', palettenDaten);
    };

    // Test-Funktion für Druck
    window.testDruck = function () {
        console.log('=== Druck-Test ===');
        console.log('Paletten-Daten:', palettenDaten);
        console.log('Anzahl Paletten:', palettenDaten.length);

        if (palettenDaten.length > 0) {
            console.log('✅ Daten vorhanden - teste Etiketten-Druck');
            palettenetikettenAusdruck();
        } else {
            console.log('❌ Keine Paletten-Daten - führe Test-Berechnung durch');
            window.testBerechnung();
            setTimeout(() => {
                console.log('🔄 Test-Daten gesetzt, erneut versuchen...');
                palettenetikettenAusdruck();
            }, 500);
        }
    };

    console.log('🔧 Debug-Funktionen verfügbar: testValidierung(), testBerechnung(), testDruck()');
});

// Hilfsfunktionen
function isModified() {
    const form = document.getElementById('lieferungForm');
    if (!form) return false;
    return Array.from(form.elements).some(el => el.value && el.value.trim() !== '');
}

function getFormData() {
    return {
        lieferscheinnummer: document.getElementById('lieferscheinnummer')?.value || '',
        lieferdatum: document.getElementById('lieferdatum')?.value || '',
        abnehmer: document.getElementById('abnehmer')?.value || '',
        erste_gebinde: document.getElementById('erste_gebinde')?.value || '',
        letzte_gebinde: document.getElementById('letzte_gebinde')?.value || '',
        anzahl_gebinde: document.getElementById('anzahl_gebinde')?.value || '',
        anzahl_paletten: document.getElementById('anzahl_paletten')?.value || '',
        notizen: document.getElementById('notizen')?.value || '',
        palettenDaten: palettenDaten
    };
}

// Paletten-Berechnung
function berechnePaletten() {
    console.log('berechnePaletten() aufgerufen');

    const ersteGebinde = document.getElementById('erste_gebinde').value.trim();
    const letzteGebinde = document.getElementById('letzte_gebinde').value.trim();

    console.log('Eingabewerte:', ersteGebinde, letzteGebinde);

    // Felder leeren wenn eine Eingabe fehlt
    if (!ersteGebinde || !letzteGebinde) {
        document.getElementById('anzahl_gebinde').value = '';
        document.getElementById('anzahl_paletten').value = '';
        versteckePalettenUebersicht();
        console.log('Eingaben unvollständig - Felder geleert');
        return;
    }

    // Zahlen extrahieren
    const ersteNr = extractNumber(ersteGebinde);
    const letzteNr = extractNumber(letzteGebinde);

    console.log('Extrahierte Zahlen:', ersteNr, letzteNr);

    if (ersteNr && letzteNr && letzteNr >= ersteNr) {
        // Gültige Berechnung
        const gesamtGebinde = letzteNr - ersteNr + 1;
        const anzahlPaletten = Math.ceil(gesamtGebinde / GEBINDE_PRO_PALETTE);

        console.log('Berechnung:', gesamtGebinde, 'Gebinde,', anzahlPaletten, 'Paletten');

        // Ergebnisse eintragen
        document.getElementById('anzahl_gebinde').value = gesamtGebinde;
        document.getElementById('anzahl_paletten').value = anzahlPaletten;

        // Paletten-Details berechnen
        palettenDaten = berechnePalettenDetails(ersteNr, letzteNr);
        zeigePalettenUebersicht();

    } else {
        // Ungültige Eingabe
        document.getElementById('anzahl_gebinde').value = '';
        document.getElementById('anzahl_paletten').value = '';
        versteckePalettenUebersicht();
        console.log('Ungültige Eingaben');
    }
}

// Zahl aus String extrahieren
function extractNumber(str) {
    const match = str.toString().match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}

// Paletten-Details berechnen
function berechnePalettenDetails(ersteNr, letzteNr) {
    const paletten = [];
    const gesamtGebinde = letzteNr - ersteNr + 1;
    let aktuelleGebindeNr = ersteNr;

    for (let paletteNr = 1; aktuelleGebindeNr <= letzteNr; paletteNr++) {
        const verbleibendeGebinde = letzteNr - aktuelleGebindeNr + 1;
        const gebindeAufPalette = Math.min(GEBINDE_PRO_PALETTE, verbleibendeGebinde);

        paletten.push({
            paletteNr: paletteNr,
            vonGebinde: aktuelleGebindeNr,
            bisGebinde: aktuelleGebindeNr + gebindeAufPalette - 1,
            anzahlGebinde: gebindeAufPalette
        });

        aktuelleGebindeNr += gebindeAufPalette;
    }

    return paletten;
}

// Paletten-Übersicht anzeigen
function zeigePalettenUebersicht() {
    const uebersicht = document.getElementById('palettenUebersicht');
    if (!uebersicht || palettenDaten.length === 0) return;

    const tbody = uebersicht.querySelector('tbody');
    if (!tbody) return;

    // Tabelle leeren
    tbody.innerHTML = '';

    // Paletten-Zeilen hinzufügen
    palettenDaten.forEach(palette => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td class="text-center">${palette.paletteNr}</td>
            <td class="text-center">${palette.vonGebinde}</td>
            <td class="text-center">${palette.bisGebinde}</td>
            <td class="text-center">${palette.anzahlGebinde}</td>
        `;
    });

    // Übersicht anzeigen
    uebersicht.style.display = 'block';
    console.log('Paletten-Übersicht angezeigt');
}

// Paletten-Übersicht verstecken
function versteckePalettenUebersicht() {
    const uebersicht = document.getElementById('palettenUebersicht');
    if (uebersicht) {
        uebersicht.style.display = 'none';
    }
}

// Palettenetiketten drucken
function palettenetikettenAusdruck() {
    console.log('🎨 Palettenetiketten-Ausdruck gestartet');

    if (!palettenDaten || palettenDaten.length === 0) {
        alert('Bitte erst Paletten berechnen!\n\nHinweis: Geben Sie Werte in "Erste Gebinde Nr." und "Letzte Gebinde Nr." ein.');
        return;
    }

    const html = generiereEtikettenHTML();

    // Blob-URL erstellen – wird nicht von Popup-Blockern geblockt
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const tab = window.open(url, '_blank');

    if (!tab) {
        // Letzter Fallback: direkt im selben Fenster als Druckansicht
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;background:white;';
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.onload = () => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            iframe.contentWindow.onafterprint = () => {
                document.body.removeChild(iframe);
                URL.revokeObjectURL(url);
            };
        };
    } else {
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
}

// Paletten-Packliste drucken
function palettenPacklisteAusdruck() {
    console.log('Paletten-Packliste-Ausdruck gestartet');

    if (!palettenDaten || palettenDaten.length === 0) {
        alert('Bitte erst Paletten berechnen!\n\nHinweis: Geben Sie Werte in "Erste Gebinde Nr." und "Letzte Gebinde Nr." ein.');
        return;
    }

    const html = generierePacklisteHTML();

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const tab = window.open(url, '_blank');

    if (!tab) {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;background:white;';
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.onload = () => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            iframe.contentWindow.onafterprint = () => {
                document.body.removeChild(iframe);
                URL.revokeObjectURL(url);
            };
        };
    } else {
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
}

// Alternative Druck-Methode ohne Popups
function alternativerDruck(typ) {
    console.log('Starte alternativen Druck für:', typ);

    // Erstelle versteckten Druckbereich
    let printDiv = document.getElementById('printArea');
    if (printDiv) {
        printDiv.remove();
    }

    printDiv = document.createElement('div');
    printDiv.id = 'printArea';
    printDiv.style.position = 'fixed';
    printDiv.style.top = '-9999px';
    printDiv.style.left = '-9999px';
    printDiv.innerHTML = typ === 'etiketten' ? generiereEtikettenHTML() : generierePacklisteHTML();
    document.body.appendChild(printDiv);

    // CSS für Druck hinzufügen
    let printStyle = document.getElementById('printStyle');
    if (printStyle) {
        printStyle.remove();
    }

    printStyle = document.createElement('style');
    printStyle.id = 'printStyle';
    printStyle.textContent = `
        @media print {
            body * { visibility: hidden; }
            #printArea, #printArea * { visibility: visible; }
            #printArea { position: static !important; top: auto !important; left: auto !important; }
        }
    `;
    document.head.appendChild(printStyle);

    // Drucken
    setTimeout(() => {
        window.print();

        // Aufräumen nach dem Drucken
        setTimeout(() => {
            if (printDiv) printDiv.remove();
            if (printStyle) printStyle.remove();
        }, 1000);
    }, 500);
}

// HTML für Packliste generieren
function generierePacklisteHTML() {
    const lieferdatum = document.getElementById('lieferdatum')?.value || '';
    const lieferscheinnummer = document.getElementById('lieferscheinnummer')?.value || '';
    const abnehmer = document.getElementById('abnehmer')?.value || '';

    const abnehmerDetails = {
        biotest: { name: 'Biotest-Pharma GmbH & Co KG', adresse: 'Landsteiner Str. 5, D-63303 Dreieich' },
        csl: { name: 'CSL Behring AG', adresse: 'Wankdorfstr. 10, CH-03000 Bern' }
    };
    const abnehmerName = abnehmerDetails[abnehmer]?.name || 'Nicht ausgewählt';
    const formatiertesDatum = lieferdatum
        ? new Date(lieferdatum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '___________';

    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Paletten-Packliste</title>
            <style>
                @page {
                    margin: 15mm;
                    size: A4;
                }
                @media print {
                    @page {
                        margin: 15mm;
                        size: A4;
                    }
                    body {
                        margin: 0;
                    }
                }
                body {
                    font-family: Calibri, Arial, sans-serif;
                    font-size: 11pt;
                    margin: 0;
                    padding: 0;
                    color: #000;
                }
                .packliste {
                    width: 100%;
                }
                h2 {
                    font-size: 16pt;
                    margin: 0 0 8mm 0;
                    text-align: left;
                }
                .header-info {
                    margin-bottom: 6mm;
                }
                .info-zeile {
                    margin: 1.2mm 0;
                }
                .abnehmer-info {
                    margin-bottom: 6mm;
                    font-weight: bold;
                }
                .paletten-tabelle {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1px solid #000;
                }
                .paletten-tabelle th,
                .paletten-tabelle td {
                    border: 1px solid #000;
                    padding: 2.2mm;
                }
                .paletten-tabelle th {
                    background: #f3f3f3;
                    text-align: center;
                    font-weight: bold;
                }
                .zentriert {
                    text-align: center;
                }
                .gesamt-zeile td {
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="packliste">
                <h2>2.4 Paletten Packliste Plasma</h2>

                <div class="header-info">
                    <div class="info-zeile"><strong>Lieferschein-Nr.: ${lieferscheinnummer || '___________'}</strong></div>
                    <div class="info-zeile"><strong>Lieferdatum: ${formatiertesDatum}</strong></div>
                    <div class="info-zeile">Anzahl Paletten: ${palettenDaten.length}</div>
                </div>

                <div class="abnehmer-info">Abnehmer: ${abnehmerName}</div>

                <table class="paletten-tabelle">
                <thead>
                    <tr>
                        <th>Palette Nr.</th>
                        <th>Von Gebinde</th>
                        <th>Bis Gebinde</th>
                        <th>Anzahl Gebinde</th>
                        <th>Bemerkungen</th>
                    </tr>
                </thead>
                <tbody>
    `;

    palettenDaten.forEach(palette => {
        html += `
            <tr>
                <td>${palette.paletteNr}</td>
                <td>${palette.vonGebinde}</td>
                <td>${palette.bisGebinde}</td>
                <td>${palette.anzahlGebinde}</td>
                <td></td>
            </tr>
        `;
    });

    const gesamtGebinde = palettenDaten.reduce((sum, p) => sum + p.anzahlGebinde, 0);

    html += `
                </tbody>
            </table>
            
            <tr class="gesamt-zeile">
                <td colspan="3"><strong>Gesamtzahl Gebinde:</strong></td>
                <td class="zentriert"><strong>${gesamtGebinde}</strong></td>
                <td></td>
            </tr>
            </tbody>
            </table>

            <div style="margin-top: 10mm; border-top: 1px solid #999; padding-top: 6mm;">
                <div>Datum/Unterschrift Kommissionierung: ________________________</div>
                <br>
                <div>Datum/Unterschrift Kontrolle: ________________________</div>
            </div>
            </div>
        <script>window.addEventListener('load', function() { window.print(); });<\/script>
        </body>
        </html>
    `;

    return html;
}

// HTML für Etiketten generieren
function generiereEtikettenHTML() {
    console.log('🛠️ Generiere Etiketten HTML...');

    const lieferdatum = document.getElementById('lieferdatum')?.value || '';
    const lieferscheinnummer = document.getElementById('lieferscheinnummer')?.value || '';
    const abnehmer = document.getElementById('abnehmer')?.value || '';

    const abnehmerDetails = {
        biotest: { name: 'Biotest-Pharma GmbH & Co KG', adresse: 'Landsteiner Str. 5<br>D-63303 Dreieich' },
        csl: { name: 'CSL Behring AG', adresse: 'Wankdorfstr. 10<br>CH-03000 Bern' }
    };
    const abnehmerName = abnehmerDetails[abnehmer]?.name || 'Nicht ausgewählt';
    const abnehmerAdresse = abnehmerDetails[abnehmer]?.adresse || '';
    const formatiertesDatum = lieferdatum
        ? new Date(lieferdatum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '___________';

    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Palettenetiketten</title>
    <style>
        @page {
            margin: 0;
            size: A4;
        }
        
        @media print {
            @page {
                margin: 10mm;
                size: A4;
            }
            .no-print {
                display: none !important;
            }
            body {
                color: black !important;
                background: white !important;
            }
            .etikett {
                page-break-after: always !important;
                display: block !important;
                visibility: visible !important;
            }
            .etikett:last-child {
                page-break-after: avoid !important;
            }
            * {
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
        
        body {
            font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
        }
        
        .etikett {
            width: calc(100% - 30mm);
            max-width: 180mm;
            margin: 5mm auto;
            page-break-after: always;
            padding: 10mm;
            background: white;
            position: relative;
            z-index: 1000;
        }
        
        .etikett-tabelle {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
        }
        
        .etikett-tabelle td {
            border-bottom: 1px solid #000;
            text-align: center;
            vertical-align: middle;
        }
        
        .header-cell {
            font-size: 35px;
            font-weight: bold;
        }
        
        .temp {
            font-size: 35px;
            font-weight: bold;
        }
        
        .kunde-cell {
            text-align: left;
            padding: 3mm;
        }
        
        .kunde-name {
            font-size: 35px;
            font-weight: bold;
            margin: 1mm 0;
        }
        
        .info-cell {
            font-size: 22px;
        }
        
        .info-value {
            font-size: 35px;
            font-weight: bold;
            display: block;
            margin-top: 2mm;
        }
        
        .label {
            font-size: 18pt;
            margin-bottom: 2mm;
        }
    </style>
</head>
<body>`;

    // Prüfe ob Paletten-Daten vorhanden sind
    if (!palettenDaten || palettenDaten.length === 0) {
        console.warn('⚠️ Keine Paletten-Daten verfügbar');
        html += `
        <div class="etikett">
            <table class="etikett-tabelle">
                <tr>
                    <td class="header-cell" style="height: 80mm;">PALETTENETIKETT</td>
                </tr>
                <tr>
                    <td style="text-align: center; color: red; font-size: 20px; height: 100mm;">
                        <p>FEHLER: Keine Paletten-Daten verfügbar!</p>
                        <p>Bitte geben Sie Gebinde-Nummern ein.</p>
                    </td>
                </tr>
            </table>
        </div>`;
    } else {
        console.log(`🎨 Generiere ${palettenDaten.length} professionelle Etiketten`);

        palettenDaten.forEach((palette, index) => {
            console.log(`Etikett ${index + 1}:`, palette);
            html += `
        <div class="etikett">
            <table class="etikett-tabelle">
                <!-- Header -->
                <tr>
                    <td class="header-cell" style="height: 14mm;"><strong>Human plasma for fractionation</strong></td>
                </tr>

                <tr>
                    <td class="info-cell" style="height: 14mm;">
                        <strong>Lagertemperatur / storage temperature:</strong><br>
                        <span class="temp">&lt; - 20°C</span>
                    </td>
                </tr>
                
                <!-- Kunde -->
                <tr>
                    <td class="kunde-cell" style="height: 26mm;">
                        <div class="label"><strong>Kunde / customer:</strong></div>
                        <div class="kunde-name">${abnehmerName}</div>
                        <div style="font-size: 35px; font-weight: bold;">${abnehmerAdresse}</div>
                    </td>
                </tr>
                
                <!-- Lieferschein & Datum -->
                <tr>
                    <td class="info-cell" style="height: 14mm;">
                        <strong>Lieferdatum / date of delivery:</strong><br>
                        <span class="info-value">${formatiertesDatum}</span>
                    </td>
                </tr>
                <tr>
                    <td class="info-cell" style="height: 14mm;">
                        <strong>Lieferscheinnummer / delivery note:</strong><br>
                        <span class="info-value">${lieferscheinnummer || 'LSN-____'}</span>
                    </td>
                </tr>
                <tr>
                    <td class="info-cell" style="height: 14mm;">
                        <strong>Palettennummer / pallet-No.:</strong><br>
                        <span class="info-value">${String(palette.paletteNr).padStart(2, '0')} von/of ${String(palettenDaten.length).padStart(2, '0')}</span>
                    </td>
                </tr>
                <tr>
                    <td class="info-cell" style="height: 14mm;">
                        <strong>Gebindenummer / box-Nr.: from-to:</strong><br>
                        <span class="info-value">${palette.vonGebinde}&nbsp;&nbsp;&nbsp;to&nbsp;&nbsp;&nbsp;${palette.bisGebinde}</span>
                    </td>
                </tr>
                <tr>
                    <td class="info-cell" style="height: 14mm;">
                        <strong>Anzahl Gebinde / number of boxes:</strong><br>
                        <span class="info-value">${palette.anzahlGebinde}</span>
                    </td>
                </tr>
                <tr>
                    <td class="kunde-cell" style="height: 20mm;">
                        <div class="label"><strong>Absender / consigner:</strong></div>
                        <div class="kunde-name" style="font-size: 28px;">DRK Blutspendedienst West</div>
                        <div style="font-size: 35px; font-weight: bold;">Zentrum Hagen</div>
                        <div style="font-size: 35px; font-weight: bold;">Feithstraße 180 - 186<br>D-58097 Hagen</div>
                    </td>
                </tr>
            </table>
        </div>`;
        });
    }

    html += `
<script>window.addEventListener('load', function() { window.print(); });<\/script>
</body>
</html>`;

    console.log('✅ Professionelles HTML generiert, Gesamt-Länge:', html.length);
    return html;
}

console.log('lieferung-logic-new.js geladen');