// =========================================
// Lieferung Form Logic - JavaScript Version
// Ersetzt die VBA-Logik aus Access
// =========================================

class LieferungManager {
    constructor() {
        this.currentRecord = null;
        this.isModified = false;
        this.abnehmerData = [];
        this.GEBINDE_PRO_PALETTE = 56; // Standard: 56 Gebinde pro Palette
        this.palettenDaten = []; // Berechnete Paletten
        this.loadAbnehmerData();
        this.setDefaultValues();
        this.updateStatus('ready', 'Bereit für neue Eingabe');
        this.startAutoSave();

        // Event-Listener erst nach DOM-Load setzen
        setTimeout(() => {
            this.setupEventListeners();

            // Bootstrap-Validierung initial deaktivieren
            const form = document.getElementById('lieferungForm');
            form?.classList.remove('was-validated');

            document.getElementById('lieferscheinnummer')?.focus();
        }, 100);
    }

    setupEventListeners() {
        // Button Events
        document.getElementById('btnPalettenetiketten')?.addEventListener('click', () => this.palettenetikettenAusdruck());
        document.getElementById('btnPalettenPackliste')?.addEventListener('click', () => this.palettenPacklisteAusdruck());

        // Form Events
        const form = document.getElementById('lieferungForm');
        form?.addEventListener('submit', (e) => this.handleSubmit(e));

        // Field Events - Auto-Berechnung für Gebinde UND Paletten
        document.getElementById('erste_gebinde')?.addEventListener('input', () => {
            this.berechnePaletten();
        });
        document.getElementById('letzte_gebinde')?.addEventListener('input', () => {
            this.berechnePaletten();
        });

        // Alle Input-Felder für Änderungserkennung (außer Notizen)
        const inputs = document.querySelectorAll('#lieferungForm input:not(#notizen), #lieferungForm select, #lieferungForm textarea:not(#notizen)');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.isModified = true;
                this.updateStatus('saving', 'Ungespeicherte Änderungen');
            });
        });

        // Notizen-Feld separat behandeln (keine Validierung)
        document.getElementById('notizen')?.addEventListener('input', (e) => {
            const notizen = e.target;
            notizen.classList.remove('is-valid', 'is-invalid');
            this.isModified = true;
            this.updateStatus('saving', 'Ungespeicherte Änderungen');
        });
    }

    // Auto-Save (alle 30 Sekunden)
    startAutoSave() {
        setInterval(() => {
            if (this.isModified) {
                this.autoSave();
            }
        }, 30000);
    }

    // ===========================================
    // DATEN-OPERATIONEN (ersetzt VBA RecordSet)
    // ===========================================

    async loadAbnehmerData() {
        // Simuliert das Laden aus tblAbnehmer
        try {
            // Hier würdest du normalerweise eine API aufrufen
            this.abnehmerData = [
                { id: 'biotest', name: 'Biotest-Pharma GmbH & Co KG', code: 'BIO' },
                { id: 'csl', name: 'CSL Behring', code: 'CSL' }
            ];

            this.populateAbnehmerSelect();
        } catch (error) {
            console.error('Fehler beim Laden der Abnehmer:', error);
            this.showError('Abnehmer-Daten konnten nicht geladen werden');
        }
    }

    populateAbnehmerSelect() {
        const select = document.getElementById('abnehmer');

        // Clear existing options (außer dem ersten)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // Add Abnehmer options
        this.abnehmerData.forEach(abnehmer => {
            const option = document.createElement('option');
            option.value = abnehmer.id;
            option.textContent = abnehmer.name;
            select.appendChild(option);
        });
    }

    // ===========================================
    // FORM OPERATIONS (ersetzt VBA Form Events)
    // ===========================================

    neuerDatensatz() {
        if (this.isModified) {
            if (!confirm('Ungespeicherte Änderungen gehen verloren. Fortfahren?')) {
                return;
            }
        }

        // Clear all fields
        const form = document.getElementById('lieferungForm');
        form.reset();

        // Bootstrap-Validierung zurücksetzen
        form.classList.remove('was-validated');

        // Gebinde-Felder zurücksetzen
        this.resetGebindeValidation();

        // Set defaults
        this.setDefaultValues();
        this.currentRecord = null;
        this.isModified = false;

        this.updateStatus('ready', 'Neuer Datensatz erstellt');

        // Focus first field
        document.getElementById('lieferscheinnummer').focus();
    }

    async speichern() {
        if (!this.validateForm()) {
            return false;
        }

        this.updateStatus('saving', 'Speichere...');

        try {
            const formData = this.getFormData();

            // Simuliert das Speichern in die Datenbank
            await this.saveToDatabase(formData);

            this.isModified = false;
            this.updateStatus('saved', 'Erfolgreich gespeichert');
            this.updateLastSaved();

            return true;
        } catch (error) {
            console.error('Speicherfehler:', error);
            this.updateStatus('error', 'Fehler beim Speichern');
            this.showError('Daten konnten nicht gespeichert werden: ' + error.message);
            return false;
        }
    }

    async loeschen() {
        if (!this.currentRecord) {
            this.showError('Kein Datensatz zum Löschen ausgewählt');
            return;
        }

        if (!confirm('Datensatz wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            return;
        }

        try {
            // Simuliert das Löschen aus der Datenbank
            await this.deleteFromDatabase(this.currentRecord.id);

            this.neuerDatensatz();
            this.showSuccess('Datensatz erfolgreich gelöscht');
        } catch (error) {
            console.error('Löschfehler:', error);
            this.showError('Fehler beim Löschen: ' + error.message);
        }
    }

    // ===========================================
    // PALETTEN BUSINESS LOGIC (Hauptlogik)
    // ===========================================

    berechnePaletten() {
        const ersteGebinde = document.getElementById('erste_gebinde').value;
        const letzteGebinde = document.getElementById('letzte_gebinde').value;

        if (ersteGebinde && letzteGebinde) {
            // Extract numbers from gebinde strings (z.B. "220" -> 220)
            const ersteNr = this.extractNumber(ersteGebinde);
            const letzteNr = this.extractNumber(letzteGebinde);

            if (ersteNr && letzteNr && letzteNr >= ersteNr) {
                // Gesamtanzahl Gebinde berechnen
                const gesamtGebinde = letzteNr - ersteNr + 1;
                document.getElementById('anzahl_gebinde').value = gesamtGebinde;

                // Paletten berechnen
                const anzahlPaletten = Math.ceil(gesamtGebinde / this.GEBINDE_PRO_PALETTE);
                document.getElementById('anzahl_paletten').value = anzahlPaletten;

                // Detaillierte Paletten-Aufteilung berechnen
                this.palettenDaten = this.berechnePalettenDetails(ersteNr, letzteNr);

                // Paletten-Übersicht anzeigen
                this.updatePalettenUebersicht();

                // Debug output
                console.log('Paletten-Berechnung:', {
                    ersteGebinde: ersteNr,
                    letzteGebinde: letzteNr,
                    gesamtGebinde,
                    anzahlPaletten,
                    paletten: this.palettenDaten
                });

            } else {
                document.getElementById('anzahl_gebinde').value = '';
                document.getElementById('anzahl_paletten').value = '';
                this.palettenDaten = [];
                this.updatePalettenUebersicht();
            }
        } else {
            // Felder leeren wenn Eingabe ungültig
            document.getElementById('anzahl_gebinde').value = '';
            document.getElementById('anzahl_paletten').value = '';
            this.palettenDaten = [];
            this.updatePalettenUebersicht();
        }
    }

    berechnePalettenDetails(ersteNr, letzteNr) {
        const paletten = [];
        let aktuelleGebindeNr = ersteNr;
        let palettenNr = 1;

        while (aktuelleGebindeNr <= letzteNr) {
            const palettenStart = aktuelleGebindeNr;
            const palettenEnde = Math.min(aktuelleGebindeNr + this.GEBINDE_PRO_PALETTE - 1, letzteNr);
            const gebindeAufPalette = palettenEnde - palettenStart + 1;

            paletten.push({
                palettenNr: palettenNr,
                vonGebinde: palettenStart,
                bisGebinde: palettenEnde,
                anzahlGebinde: gebindeAufPalette,
                istVollePalette: gebindeAufPalette === this.GEBINDE_PRO_PALETTE
            });

            aktuelleGebindeNr = palettenEnde + 1;
            palettenNr++;
        }

        return paletten;
    }

    updatePalettenUebersicht() {
        const uebersicht = document.getElementById('palettenUebersicht');
        const tabelle = document.getElementById('palettenTabelle');

        if (this.palettenDaten.length > 0) {
            // Tabelle füllen
            tabelle.innerHTML = this.palettenDaten.map(palette => `
                <tr>
                    <td><strong>${palette.palettenNr}</strong></td>
                    <td>${palette.vonGebinde}</td>
                    <td>${palette.bisGebinde}</td>
                    <td>
                        <span class="badge ${palette.istVollePalette ? 'bg-success' : 'bg-warning text-dark'}">
                            ${palette.anzahlGebinde}
                        </span>
                    </td>
                    <td>
                        ${palette.istVollePalette ?
                    '<i class="bi bi-check-circle text-success"></i> Vollständig' :
                    '<i class="bi bi-exclamation-triangle text-warning"></i> Teilpalette'
                }
                    </td>
                </tr>
            `).join('');

            // Übersicht anzeigen
            uebersicht.style.display = 'block';
        } else {
            // Übersicht verstecken
            uebersicht.style.display = 'none';
        }
    }

    // Spezielle Validierung für Gebinde-Felder (jetzt Pflichtfelder)
    handleGebindeValidation() {
        const ersteGebinde = document.getElementById('erste_gebinde');
        const letzteGebinde = document.getElementById('letzte_gebinde');

        // Entferne alte Validierungs-Klassen
        ersteGebinde.classList.remove('is-valid', 'is-invalid');
        letzteGebinde.classList.remove('is-valid', 'is-invalid');

        // Prüfe ob beide Felder ausgefüllt sind (jetzt required)
        if (!ersteGebinde.value.trim() || !letzteGebinde.value.trim()) {
            // Leer = invalid wegen required
            if (!ersteGebinde.value.trim()) ersteGebinde.classList.add('is-invalid');
            if (!letzteGebinde.value.trim()) letzteGebinde.classList.add('is-invalid');
            return;
        }

        // Beide ausgefüllt - prüfe Logik
        const ersteNr = this.extractNumber(ersteGebinde.value);
        const letzteNr = this.extractNumber(letzteGebinde.value);

        if (ersteNr && letzteNr && letzteNr >= ersteNr) {
            // Gültig - grüne Haken anzeigen
            ersteGebinde.classList.add('is-valid');
            letzteGebinde.classList.add('is-valid');
        } else {
            // Ungültig - rote X anzeigen
            ersteGebinde.classList.add('is-invalid');
            letzteGebinde.classList.add('is-invalid');
        }
    }

    // Gebinde-Validierung zurücksetzen
    resetGebindeValidation() {
        const ersteGebinde = document.getElementById('erste_gebinde');
        const letzteGebinde = document.getElementById('letzte_gebinde');

        if (ersteGebinde && letzteGebinde) {
            ersteGebinde.classList.remove('is-valid', 'is-invalid');
            letzteGebinde.classList.remove('is-valid', 'is-invalid');
        }
    }

    // Force Reset aller Validierungszustände
    forceResetValidation() {
        const inputs = document.querySelectorAll('#erste_gebinde, #letzte_gebinde');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
            // CSS übernimmt jetzt die background-image Kontrolle
        });
    }

    // Neues Fenster für Palettenetiketten
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const etiketten = this.generiereEtikettenHTML();

printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Palettenetiketten - ${this.getFormData().lieferscheinnummer}</title >
    <style>
        ${this.getEtikettenCSS()}
    </style>
            </head >
    <body>
        ${etiketten}
        <script>window.print();</script>
    </body>
            </html >
    `);

printWindow.document.close();
    }

generiereEtikettenHTML() {
    const formData = this.getFormData();
    const abnehmerInfo = this.getAbnehmerDetails(formData.abnehmer);

    return this.palettenDaten.map(palette => `
    < div class="etikett" >
        <table class="etikett-tabelle">
            <tr>
                <td class="header-cell"><strong>Human plasma for fractionation</strong></td>
            </tr>
            <tr>
                <td class="sub-header">
                    <strong>Lagertemperatur / storage temperature:</strong><br>
                        <span class="temp">&lt; - 20°C</span>
                </td>
            </tr>
            <tr>
                <td class="kunde-cell">
                    <div class="label"><strong>Kunde / customer:</strong></div>
                    <div class="kunde-name">${abnehmerInfo.fullName}</div>
                    <div class="adresse">${abnehmerInfo.adresse.replace('\n', '<br>')}</div>
                </td>
            </tr>
            <tr>
                <td class="info-cell">
                    <strong>Lieferdatum / date of delivery:</strong><br>
                        <span class="info-value">${this.formatDate(formData.lieferdatum)}</span>
                </td>
            </tr>
            <tr>
                <td class="info-cell">
                    <strong>Lieferscheinnummer / delivery note:</strong><br>
                        <span class="info-value">${formData.lieferscheinnummer}</span>
                </td>
            </tr>
            <tr>
                <td class="info-cell">
                    <strong>Palettennummer / pallet-No.:</strong><br>
                        <span class="info-value">${palette.palettenNr.toString().padStart(2, '0')} von/of ${this.palettenDaten.length.toString().padStart(2, '0')}</span>
                </td>
            </tr>
            <tr>
                <td class="info-cell">
                    <strong>Gebindenummer / box-Nr.: from-to:</strong><br>
                        <span class="info-value">${palette.vonGebinde}&nbsp;&nbsp;&nbsp;to&nbsp;&nbsp;&nbsp;${palette.bisGebinde}</span>
                </td>
            </tr>
            <tr>
                <td class="info-cell">
                    <strong>Anzahl Gebinde / number of boxes:</strong><br>
                        <span class="info-value">${palette.anzahlGebinde}</span>
                </td>
            </tr>
            <tr>
                <td class="absender-cell">
                    <div class="label"><strong>Absender / consigner</strong></div>
                    <div class="absender-name">DRK Blutspendedienst West</div>
                    <div class="absender-name">Zentrum Hagen</div>
                    <div class="absender-adresse">Feithstraße 180 - 186<br>D-58097 Hagen</div>
                </td>
            </tr>
        </table>
            </div >
    `).join('');
}

// ===========================================
// PALETTEN-PACKLISTE GENERIERUNG  
// ===========================================

palettenPacklisteAusdruck() {
    if (this.palettenDaten.length === 0) {
        this.showError('Bitte erst Gebinde-Nummern eingeben um Paletten zu berechnen');
        return;
    }

    const printWindow = window.open('', '_blank', 'width=800,600');
    const packliste = this.generierePacklisteHTML();

    printWindow.document.write(`
    < !DOCTYPE html >
        <html>
            <head>
                <title>Paletten Packliste - ${this.getFormData().lieferscheinnummer}</title>
                <style>
                    ${this.getPacklisteCSS()}
                </style>
            </head>
            <body>
                ${packliste}
                <script>window.print();</script>
            </body>
        </html>
`);

    printWindow.document.close();
}

generierePacklisteHTML() {
    const formData = this.getFormData();
    const gesamtGebinde = this.palettenDaten.reduce((sum, p) => sum + p.anzahlGebinde, 0);

    return `
    < div class="packliste" >
                <h2>2.4 Paletten Packliste Plasma</h2>
                
                <div class="header-info">
                    <div class="info-zeile"><strong>Lieferschein-Nr.: ${formData.lieferscheinnummer}</strong></div>
                    <div class="info-zeile"><strong>Lieferdatum: ${this.formatDate(formData.lieferdatum)}</strong></div>
                    <div class="info-zeile">Anzahl Plasmen: ${gesamtGebinde * 35} <!-- Annahme: 35 Plasmen pro Gebinde --></div>
                    <div class="info-zeile">Anzahl Paletten: ${this.palettenDaten.length}</div>
                </div>
                
                <div class="abnehmer-info">
                    <strong>Abnehmer: ${formData.abnehmer}</strong>
                </div>
                
                <table class="paletten-tabelle">
                    <thead>
                        <tr>
                            <th>Paletten-<br>Nr.</th>
                            <th>von Gebinde</th>
                            <th>bis Gebinde</th>
                            <th>Anzahl Gebinde/Palette</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.palettenDaten.map(palette => `
                            <tr>
                                <td class="zentriert">${palette.palettenNr}</td>
                                <td class="zentriert">${palette.vonGebinde}</td>
                                <td class="zentriert">${palette.bisGebinde}</td>
                                <td class="zentriert">${palette.anzahlGebinde}</td>
                            </tr>
                        `).join('')}
                        <tr class="gesamt-zeile">
                            <td colspan="3"><strong>Gesamtzahl Gebinde:</strong></td>
                            <td class="zentriert"><strong>${gesamtGebinde}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div >
    `;
}

extractNumber(gebindeString) {
    // Extract number from formats like "G-0001", "220", etc.
    const match = gebindeString.toString().match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}

getAbnehmerDetails(abnehmerId) {
    const abnehmerMap = {
        'biotest': {
            fullName: 'Biotest-Pharma GmbH & Co KG',
            adresse: 'Landsteiner Str. 5\nD-63303 Dreieich'
        },
        'csl': {
            fullName: 'CSL Behring AG',
            adresse: 'Wankdorfstr. 10\nCH-03000 Bern'
        }
    };
    return abnehmerMap[abnehmerId] || { fullName: 'Unbekannt', adresse: '' };
}

formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// ===========================================
// PRINT STYLES
// ===========================================

getEtikettenCSS() {
    return `
@page {
    margin: 0;
    size: A4;
}

@media print {
    @page {
        margin: 0;
        size: A4;
    }

                .no - print {
        display: none!important;
    }

                .etikett {
        page -break-after: always!important;
    }

                .etikett: last - child {
        page -break-after: avoid!important;
    }

                * {
                    - webkit - print - color - adjust: exact!important;
    print - color - adjust: exact!important;
}
            }
            
            body {
    font - family: 'Calibri', 'Segoe UI', Tahoma, Geneva, Verdana, sans - serif;
    margin: 0;
    padding: 0;
}
            
            .etikett {
    width: calc(100 % - 30mm);
    max - width: 180mm;
    margin: 5mm auto;
    page -break-after: always;
    padding: 10mm;
    background: white;
    position: relative;
    z - index: 1000;
}
            
            .etikett - tabelle {
    width: 100 %;
    border - collapse: collapse;
    border: 1px solid #000;
}
            
            .etikett - tabelle td {
    border - bottom: 1px solid #000;
    text - align: center;
    vertical - align: middle;
}
            
            .header - cell {
    font - size: 35px;
    font - weight: bold;
}
            
            .sub - header {
    font - size: 22px;
}
            
            .temp {
    font - size: 35px;
    font - weight: bold;
}
            
            .kunde - cell, .absender - cell {
    text - align: left;
}
            
            .kunde - name, .absender - name {
    font - size: 35px;
    font - weight: bold;
    margin: 1mm 0;
}
            
            .adresse, .absender - adresse {
    font - size: 35px;
    font - weight: bold;
    margin - bottom: 4mm;
}
            
            .info - cell {
    font - size: 22px;
}
            
            .info - value {
    font - size: 35px;
    font - weight: bold;
    display: block;
    margin - top: 2mm;
}
            
            .label {
    font - size: 18pt;
    margin - bottom: 2mm;
}
`;
}

getPacklisteCSS() {
    return `
@page {
    margin: 15mm;
    size: A4;
}
            
            body {
    font - family: Arial, sans - serif;
    font - size: 11pt;
    margin: 0;
    padding: 0;
}
            
            .packliste {
    max - width: 100 %;
    margin: 0 auto;
}
            
            h2 {
    font - size: 14pt;
    margin - bottom: 20px;
    text - align: left;
}
            
            .header - info {
    margin - bottom: 20px;
}
            
            .info - zeile {
    margin: 4px 0;
    font - size: 11pt;
}
            
            .abnehmer - info {
    margin: 15px 0;
    font - size: 12pt;
}
            
            .paletten - tabelle {
    width: 100 %;
    border - collapse: collapse;
    margin - top: 15px;
}
            
            .paletten - tabelle th,
            .paletten - tabelle td {
    border: 1px solid #000;
    padding: 8px;
    text - align: left;
    font - size: 10pt;
}
            
            .paletten - tabelle th {
    background - color: #f0f0f0;
    font - weight: bold;
    text - align: center;
}
            
            .zentriert {
    text - align: center!important;
}
            
            .gesamt - zeile {
    background - color: #f5f5f5;
    font - weight: bold;
}
`;
}

validateDatum() {
    const datumInput = document.getElementById('lieferdatum');
    const datum = new Date(datumInput.value);
    const heute = new Date();

    // Remove time component für comparison
    heute.setHours(0, 0, 0, 0);

    if (datum > heute) {
        if (!confirm('Das Lieferdatum liegt in der Zukunft. Ist das korrekt?')) {
            datumInput.value = heute.toISOString().split('T')[0];
        }
    }
}

generateLieferscheinnummer() {
    const abnehmerCode = this.getSelectedAbnehmerCode();
    const datum = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const randomNr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    return `LSN - ${ abnehmerCode } -${ datum } -${ randomNr } `;
}

getSelectedAbnehmerCode() {
    const abnehmerId = document.getElementById('abnehmer').value;
    const abnehmer = this.abnehmerData.find(a => a.id === abnehmerId);
    return abnehmer ? abnehmer.code : 'XXX';
}

// ===========================================
// VALIDATION (ersetzt VBA Validation)
// ===========================================

validateForm() {
    const form = document.getElementById('lieferungForm');

    // Bootstrap validation
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        this.showError('Bitte füllen Sie alle Pflichtfelder aus');
        return false;
    }

    // Custom validations
    const errors = [];

    // Datum validation
    const lieferdatum = new Date(document.getElementById('lieferdatum').value);
    const vor30Tagen = new Date();
    vor30Tagen.setDate(vor30Tagen.getDate() - 30);

    if (lieferdatum < vor30Tagen) {
        errors.push('Lieferdatum darf nicht älter als 30 Tage sein');
    }

    // Gebinde validation
    const ersteGebinde = document.getElementById('erste_gebinde').value;
    const letzteGebinde = document.getElementById('letzte_gebinde').value;

    if (ersteGebinde && letzteGebinde) {
        const ersteNr = this.extractNumber(ersteGebinde);
        const letzteNr = this.extractNumber(letzteGebinde);

        if (letzteNr < ersteNr) {
            errors.push('Letzte Gebinde-Nummer muss größer als erste sein');
        }
    }

    if (errors.length > 0) {
        this.showError(errors.join('\n'));
        return false;
    }

    return true;
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

setDefaultValues() {
    // Set heute als default Lieferdatum
    const heute = new Date().toISOString().split('T')[0];
    document.getElementById('lieferdatum').value = heute;

    // Lieferscheinnummer bleibt leer - muss manuell eingegeben werden
}

getFormData() {
    return {
        lieferdatum: document.getElementById('lieferdatum').value,
        lieferscheinnummer: document.getElementById('lieferscheinnummer').value,
        abnehmer: document.getElementById('abnehmer').value,
        anzahl_paletten: parseInt(document.getElementById('anzahl_paletten').value) || 0,
        erste_gebinde: document.getElementById('erste_gebinde').value,
        letzte_gebinde: document.getElementById('letzte_gebinde').value,
        anzahl_gebinde: parseInt(document.getElementById('anzahl_gebinde').value) || 0,
        notizen: document.getElementById('notizen').value,
        erstellt: new Date().toISOString()
    };
}

    async saveToDatabase(data) {
    // Simuliert API call - hier würdest du zur REST API gehen
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.001) { // 99.9% success rate
                console.log('Daten gespeichert:', data);
                resolve({ id: Date.now(), ...data });
            } else {
                reject(new Error('Datenbankfehler'));
            }
        }, 1000);
    });
}

    async deleteFromDatabase(id) {
    // Simuliert API call für DELETE
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.001) { // 99.9% success rate
                resolve({ deleted: id });
            } else {
                reject(new Error('Löschvorgang fehlgeschlagen'));
            }
        }, 500);
    });
}

    async autoSave() {
    if (this.validateForm()) {
        try {
            await this.speichern();
            console.log('Auto-Save erfolgreich');
        } catch (error) {
            console.warn('Auto-Save fehlgeschlagen:', error);
        }
    }
}

handleSubmit(event) {
    event.preventDefault();
    this.speichern();
}

drucken() {
    window.print();
}

// ===========================================
// UI FEEDBACK FUNCTIONS
// ===========================================

updateStatus(type, message) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = `fw - bold text - ${ this.getStatusColor(type) } `;
}

getStatusColor(type) {
    const colors = {
        ready: 'success',
        saving: 'warning',
        saved: 'success',
        error: 'danger'
    };
    return colors[type] || 'secondary';
}

updateLastSaved() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('lastSaved').textContent = timeString;
}

showError(message) {
    // Hier könntest du eine schöne Toast-Notification einbauen
    alert('Fehler: ' + message);
}

showSuccess(message) {
    // Hier könntest du eine schöne Toast-Notification einbauen
    alert('Erfolg: ' + message);
}
}

// ===========================================
// INITIALIZATION
// ===========================================

// Page loaded - initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.lieferungManager = new LieferungManager();

    // Keyboard shortcuts (ersetzt Access KeyDown Events)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    window.lieferungManager.neuerDatensatz();
                    break;
                case 's':
                    e.preventDefault();
                    window.lieferungManager.speichern();
                    break;
                case 'p':
                    e.preventDefault();
                    window.lieferungManager.drucken();
                    break;
            }
        }
    });
});

// Export für andere Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LieferungManager;
}

// Automatisch eine Instanz erstellen wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', function() {
    // Globale Instanz für Debugging und externe Zugriffe
    window.lieferungManager = new LieferungManager();
    console.log('LieferungManager initialisiert');
});