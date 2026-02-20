-- Tabellenstruktur: tblLieferung
-- Erstellt: 19.02.2026 12:37:37

CREATE TABLE [tblLieferung] (
  [Lieferscheinnummer] LONG,
  [Lieferdatum] DATETIME,
  [Abnehmer] VARCHAR(255),
  [Anzahl Paletten] LONG,
  [Aktuelle Palette] LONG,
  [Erste Gebinde Nummer] LONG,
  [Letzte Gebinde Nummer] LONG,
  [Anzahl Gebinde] LONG
);

