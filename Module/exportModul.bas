' =================================================
' Access Datenbank Vollständiger Exporter
' Exportiert alle Objekte einer Access-Datenbank
' Erstellt: 19. Februar 2026
' =================================================

Option Compare Database
Option Explicit

' Globale Variablen für Export
Private strExportPfad As String
Private intExportierteObjekte As Integer

' =================================================
' HAUPTFUNKTION: Vollständiger Datenbankexport
' =================================================
Public Sub AccessDatenbankVollstaendigExportieren()
    On Error GoTo Err_AccessDatenbankVollstaendigExportieren
    
    Dim strBasisPfad As String
    Dim strZeitstempel As String
    
    ' Basisexportpfad festlegen
    strBasisPfad = CurrentProject.path & "\Export\"
    strZeitstempel = Format(Now, "yyyy-mm-dd_hh-nn-ss")
    strExportPfad = strBasisPfad & "DB_Export_" & strZeitstempel & "\"
    
    ' Exportordner erstellen
    Call OrdnerErstellen(strExportPfad)
    
    ' Zähler zurücksetzen
    intExportierteObjekte = 0
    
    ' Status anzeigen
    DoCmd.Hourglass True
    
    ' Export starten
    Call LogSchreiben("=== DATENBANKEXPORT GESTARTET ===")
    Call LogSchreiben("Exportpfad: " & strExportPfad)
    
    ' 1. Module exportieren
    Call ModuleExportieren
    
    ' 2. Formulare exportieren
    Call FormulareExportieren
    
    ' 3. Berichte exportieren
    Call BerichteExportieren
    
    ' 4. Abfragen exportieren
    Call AbfragenExportieren
    
    ' 5. Tabellen exportieren (Struktur & Daten)
    Call TabellenExportieren
    
    ' 6. Makros exportieren
    Call MakrosExportieren
    
    ' 7. Beziehungen exportieren
    Call BeziehungenExportieren
    
    ' 8. Datenbankeigenschaften exportieren
    Call DatenbankeigenschaftenExportieren
    
    ' Abschluss
    DoCmd.Hourglass False
    
    Call LogSchreiben("=== EXPORT ABGESCHLOSSEN ===")
    Call LogSchreiben("Exportierte Objekte: " & intExportierteObjekte)
    
    MsgBox "Export erfolgreich abgeschlossen!" & vbCrLf & _
           "Objekte exportiert: " & intExportierteObjekte & vbCrLf & _
           "Pfad: " & strExportPfad, vbInformation, "Datenbankexport"

Exit_AccessDatenbankVollstaendigExportieren:
    DoCmd.Hourglass False
    Exit Sub
    
Err_AccessDatenbankVollstaendigExportieren:
    DoCmd.Hourglass False
    Call FehlerBehandlung("AccessDatenbankVollstaendigExportieren", Err.Number, Err.Description)
    Resume Exit_AccessDatenbankVollstaendigExportieren
End Sub

' =================================================
' MODULE EXPORTIEREN
' =================================================
Private Sub ModuleExportieren()
    On Error GoTo Err_ModuleExportieren
    
    Dim obj As AccessObject
    Dim strModulPfad As String
    
    ' Ordner für Module erstellen
    strModulPfad = strExportPfad & "Module\"
    Call OrdnerErstellen(strModulPfad)
    
    Call LogSchreiben("Exportiere Module...")
    
    ' Standard Module
    For Each obj In CurrentProject.AllModules
        Application.SaveAsText acModule, obj.name, strModulPfad & obj.name & ".bas"
        Call LogSchreiben("Modul exportiert: " & obj.name)
        intExportierteObjekte = intExportierteObjekte + 1
    Next obj

Exit_ModuleExportieren:
    Exit Sub
    
Err_ModuleExportieren:
    Call FehlerBehandlung("ModuleExportieren", Err.Number, Err.Description)
    Resume Exit_ModuleExportieren
End Sub

' =================================================
' FORMULARE EXPORTIEREN
' =================================================
Private Sub FormulareExportieren()
    On Error GoTo Err_FormulareExportieren
    
    Dim obj As AccessObject
    Dim strFormularPfad As String
    
    ' Ordner für Formulare erstellen
    strFormularPfad = strExportPfad & "Formulare\"
    Call OrdnerErstellen(strFormularPfad)
    
    Call LogSchreiben("Exportiere Formulare...")
    
    For Each obj In CurrentProject.AllForms
        ' Formular als Text exportieren
        Application.SaveAsText acForm, obj.name, strFormularPfad & obj.name & ".txt"
        Call LogSchreiben("Formular exportiert: " & obj.name)
        intExportierteObjekte = intExportierteObjekte + 1
    Next obj

Exit_FormulareExportieren:
    Exit Sub
    
Err_FormulareExportieren:
    Call FehlerBehandlung("FormulareExportieren", Err.Number, Err.Description)
    Resume Exit_FormulareExportieren
End Sub

' =================================================
' BERICHTE EXPORTIEREN
' =================================================
Private Sub BerichteExportieren()
    On Error GoTo Err_BerichteExportieren
    
    Dim obj As AccessObject
    Dim strBerichtPfad As String
    
    ' Ordner für Berichte erstellen
    strBerichtPfad = strExportPfad & "Berichte\"
    Call OrdnerErstellen(strBerichtPfad)
    
    Call LogSchreiben("Exportiere Berichte...")
    
    For Each obj In CurrentProject.AllReports
        ' Bericht als Text exportieren
        Application.SaveAsText acReport, obj.name, strBerichtPfad & obj.name & ".txt"
        Call LogSchreiben("Bericht exportiert: " & obj.name)
        intExportierteObjekte = intExportierteObjekte + 1
    Next obj

Exit_BerichteExportieren:
    Exit Sub
    
Err_BerichteExportieren:
    Call FehlerBehandlung("BerichteExportieren", Err.Number, Err.Description)
    Resume Exit_BerichteExportieren
End Sub

' =================================================
' ABFRAGEN EXPORTIEREN
' =================================================
Private Sub AbfragenExportieren()
    On Error GoTo Err_AbfragenExportieren
    
    Dim qdf As QueryDef
    Dim strAbfragePfad As String
    Dim intDatei As Integer
    
    ' Ordner für Abfragen erstellen
    strAbfragePfad = strExportPfad & "Abfragen\"
    Call OrdnerErstellen(strAbfragePfad)
    
    Call LogSchreiben("Exportiere Abfragen...")
    
    For Each qdf In CurrentDb.QueryDefs
        If Left(qdf.name, 1) <> "~" Then ' Systemabfragen ausschließen
            
            ' SQL-Code in Datei schreiben
            intDatei = FreeFile
            Open strAbfragePfad & qdf.name & ".sql" For Output As #intDatei
            Print #intDatei, "-- Abfrage: " & qdf.name
            Print #intDatei, "-- Erstellt: " & Format(Now, "dd.mm.yyyy hh:nn:ss")
            Print #intDatei, "-- Typ: " & qdf.Type
            Print #intDatei, ""
            Print #intDatei, qdf.SQL
            Close #intDatei
            
            Call LogSchreiben("Abfrage exportiert: " & qdf.name)
            intExportierteObjekte = intExportierteObjekte + 1
        End If
    Next qdf

Exit_AbfragenExportieren:
    Exit Sub
    
Err_AbfragenExportieren:
    Call FehlerBehandlung("AbfragenExportieren", Err.Number, Err.Description)
    Resume Exit_AbfragenExportieren
End Sub

' =================================================
' TABELLEN EXPORTIEREN (Struktur & Daten)
' =================================================
Private Sub TabellenExportieren()
    On Error GoTo Err_TabellenExportieren
    
    Dim tdf As TableDef
    Dim strTabellenPfad As String
    Dim strDatenPfad As String
    
    ' Ordner erstellen
    strTabellenPfad = strExportPfad & "Tabellen\"
    strDatenPfad = strExportPfad & "Daten\"
    Call OrdnerErstellen(strTabellenPfad)
    Call OrdnerErstellen(strDatenPfad)
    
    Call LogSchreiben("Exportiere Tabellen...")
    
    For Each tdf In CurrentDb.TableDefs
        If Left(tdf.name, 4) <> "MSys" And Left(tdf.name, 1) <> "~" Then ' Systemtabellen ausschließen
            
            ' Tabellenstruktur exportieren
            Call TabellenstrukturExportieren(tdf.name, strTabellenPfad)
            
            ' Tabellendaten exportieren (wenn keine verknüpfte Tabelle)
            If Len(tdf.Connect) = 0 Then
                Call TabellendatenExportieren(tdf.name, strDatenPfad)
            End If
            
            Call LogSchreiben("Tabelle exportiert: " & tdf.name)
            intExportierteObjekte = intExportierteObjekte + 1
        End If
    Next tdf

Exit_TabellenExportieren:
    Exit Sub
    
Err_TabellenExportieren:
    Call FehlerBehandlung("TabellenExportieren", Err.Number, Err.Description)
    Resume Exit_TabellenExportieren
End Sub

' =================================================
' HILFSFUNKTIONEN
' =================================================
Private Sub TabellenstrukturExportieren(strTabellenname As String, strPfad As String)
    On Error GoTo Err_TabellenstrukturExportieren
    
    Dim tdf As TableDef
    Dim rst As DAO.Recordset
    Dim intDatei As Integer
    Dim i As Integer
    
    ' Zuerst versuchen, TableDef zu verwenden
    Set tdf = CurrentDb.TableDefs(strTabellenname)
    
    intDatei = FreeFile
    Open strPfad & strTabellenname & "_Struktur.sql" For Output As #intDatei
    
    ' Header schreiben
    Print #intDatei, "-- Tabellenstruktur: " & strTabellenname
    Print #intDatei, "-- Erstellt: " & Format(Now, "dd.mm.yyyy hh:nn:ss")
    Print #intDatei, ""
    
    ' Alternative Methode: Recordset zum Lesen der Feldstruktur
    Set rst = CurrentDb.OpenRecordset("SELECT * FROM [" & strTabellenname & "] WHERE 1=0")
    
    Print #intDatei, "CREATE TABLE [" & strTabellenname & "] ("
    
    ' Felder aus Recordset lesen (sicherer als TableDef.Fields)
    For i = 0 To rst.Fields.Count - 1
        Print #intDatei, "  [" & rst.Fields(i).name & "] " & FeldtypZuSQL(rst.Fields(i).Type, rst.Fields(i).Size);
        If i < rst.Fields.Count - 1 Then Print #intDatei, "," Else Print #intDatei, ""
    Next i
    
    Print #intDatei, ");"
    Print #intDatei, ""
    
    rst.Close
    Set rst = Nothing
    
    ' Indizes nur versuchen, wenn TableDef verfügbar
    On Error Resume Next
    Dim idx As Index
    For Each idx In tdf.Indexes
        If Err.Number = 0 Then
            Print #intDatei, "-- Index: " & idx.name
            If idx.Primary Then
                Print #intDatei, "ALTER TABLE [" & strTabellenname & "] ADD CONSTRAINT [" & idx.name & "] PRIMARY KEY (Feldliste nicht verfügbar);"
            Else
                Print #intDatei, "CREATE INDEX [" & idx.name & "] ON [" & strTabellenname & "] (Feldliste nicht verfügbar);"
            End If
        End If
        Err.Clear
    Next idx
    On Error GoTo Err_TabellenstrukturExportieren
    
    Close #intDatei

Exit_TabellenstrukturExportieren:
    If Not rst Is Nothing Then rst.Close
    Set rst = Nothing
    Exit Sub
    
Err_TabellenstrukturExportieren:
    ' Bei Fehler: Minimale Struktur-Info schreiben
    On Error Resume Next
    If intDatei > 0 Then
        Print #intDatei, "-- FEHLER beim Export der Tabellenstruktur"
        Print #intDatei, "-- Tabelle: " & strTabellenname
        Print #intDatei, "-- Fehler: " & Err.Description
        Close #intDatei
    End If
    If Not rst Is Nothing Then rst.Close
    Set rst = Nothing
    Call FehlerBehandlung("TabellenstrukturExportieren", Err.Number, Err.Description)
    Resume Exit_TabellenstrukturExportieren
End Sub

Private Sub TabellendatenExportieren(strTabellenname As String, strPfad As String)
    On Error GoTo Err_TabellendatenExportieren
    
    ' Alternative CSV Export Methode
    Dim rst As DAO.Recordset
    Dim intDatei As Integer
    Dim i As Integer
    Dim intRecordCount As Integer
    Dim strZeile As String
    
    Set rst = CurrentDb.OpenRecordset(strTabellenname)
    
    If rst.RecordCount > 0 Then
        intDatei = FreeFile
        Open strPfad & strTabellenname & ".csv" For Output As #intDatei
        
        ' Header schreiben
        strZeile = ""
        For i = 0 To rst.Fields.Count - 1
            If i > 0 Then strZeile = strZeile & ";"
            strZeile = strZeile & rst.Fields(i).name
        Next i
        Print #intDatei, strZeile
        
        ' Daten schreiben (max 1000 Datensätze zur Sicherheit)
        rst.MoveFirst
        intRecordCount = 0
        Do While Not rst.EOF And intRecordCount < 1000
            strZeile = ""
            For i = 0 To rst.Fields.Count - 1
                If i > 0 Then strZeile = strZeile & ";"
                strZeile = strZeile & Nz(rst.Fields(i).Value, "")
            Next i
            Print #intDatei, strZeile
            rst.MoveNext
            intRecordCount = intRecordCount + 1
        Loop
        
        Close #intDatei
    End If
    
    rst.Close
    Set rst = Nothing

Exit_TabellendatenExportieren:
    Exit Sub
    
Err_TabellendatenExportieren:
    Call FehlerBehandlung("TabellendatenExportieren", Err.Number, Err.Description)
    Resume Exit_TabellendatenExportieren
End Sub

Private Function FeldtypZuSQL(intTyp As Integer, intGroesse As Integer) As String
    Select Case intTyp
        Case dbText: FeldtypZuSQL = "VARCHAR(" & intGroesse & ")"
        Case dbMemo: FeldtypZuSQL = "MEMO"
        Case dbByte: FeldtypZuSQL = "BYTE"
        Case dbInteger: FeldtypZuSQL = "SHORT"
        Case dbLong: FeldtypZuSQL = "LONG"
        Case dbCurrency: FeldtypZuSQL = "CURRENCY"
        Case dbSingle: FeldtypZuSQL = "SINGLE"
        Case dbDouble: FeldtypZuSQL = "DOUBLE"
        Case dbDate: FeldtypZuSQL = "DATETIME"
        Case dbBoolean: FeldtypZuSQL = "YESNO"
        Case dbLongBinary: FeldtypZuSQL = "OLEOBJECT"
        Case dbGUID: FeldtypZuSQL = "GUID"
        Case Else: FeldtypZuSQL = "TEXT"
    End Select
End Function

Private Function IndexfelderListen(idx As Index) As String
    Dim fld As Field
    Dim strListe As String
    
    On Error Resume Next
    For Each fld In idx.Fields
        If Err.Number = 0 Then
            If Len(strListe) > 0 Then strListe = strListe & ", "
            strListe = strListe & "[" & fld.name & "]"
        End If
        Err.Clear
    Next fld
    
    IndexfelderListen = strListe
End Function

Private Sub MakrosExportieren()
    On Error Resume Next
    
    Dim doc As Document
    Dim strMakroPfad As String
    
    strMakroPfad = strExportPfad & "Makros\"
    Call OrdnerErstellen(strMakroPfad)
    
    Call LogSchreiben("Exportiere Makros...")
    
    For Each doc In CurrentProject.AllMacros
        Application.SaveAsText acMacro, doc.name, strMakroPfad & doc.name & ".txt"
        Call LogSchreiben("Makro exportiert: " & doc.name)
        intExportierteObjekte = intExportierteObjekte + 1
    Next doc
End Sub

Private Sub BeziehungenExportieren()
    On Error GoTo Err_BeziehungenExportieren
    
    Dim rel As Relation
    Dim intDatei As Integer
    
    intDatei = FreeFile
    Open strExportPfad & "Beziehungen.txt" For Output As #intDatei
    
    Print #intDatei, "Datenbankbeziehungen"
    Print #intDatei, "==================="
    Print #intDatei, "Erstellt: " & Format(Now, "dd.mm.yyyy hh:nn:ss")
    Print #intDatei, ""
    
    For Each rel In CurrentDb.Relations
        Print #intDatei, "Beziehung: " & rel.name
        Print #intDatei, "Von: " & rel.Table & " -> Nach: " & rel.ForeignTable
        Print #intDatei, "Attribute: " & rel.Attributes
        Print #intDatei, "---"
    Next rel
    
    Close #intDatei
    
    Call LogSchreiben("Beziehungen exportiert")
    intExportierteObjekte = intExportierteObjekte + 1

Exit_BeziehungenExportieren:
    Exit Sub
    
Err_BeziehungenExportieren:
    Call FehlerBehandlung("BeziehungenExportieren", Err.Number, Err.Description)
    Resume Exit_BeziehungenExportieren
End Sub

Private Sub DatenbankeigenschaftenExportieren()
    On Error GoTo Err_DatenbankeigenschaftenExportieren
    
    Dim intDatei As Integer
    Dim i As Integer
    
    intDatei = FreeFile
    Open strExportPfad & "Datenbankeigenschaften.txt" For Output As #intDatei
    
    Print #intDatei, "Datenbankeigenschaften"
    Print #intDatei, "======================"
    Print #intDatei, "Erstellt: " & Format(Now, "dd.mm.yyyy hh:nn:ss")
    Print #intDatei, ""
    Print #intDatei, "Datenbankname: " & CurrentProject.name
    Print #intDatei, "Pfad: " & CurrentProject.path
    Print #intDatei, "Vollständiger Name: " & CurrentProject.FullName
    Print #intDatei, "Access Version: " & Application.Version
    Print #intDatei, ""
    
    ' Nur grundlegende Properties exportieren
    On Error Resume Next
    For i = 0 To CurrentDb.Properties.Count - 1
        If Err.Number = 0 Then
            Print #intDatei, CurrentDb.Properties(i).name & " = " & CurrentDb.Properties(i).Value
        End If
        Err.Clear
    Next i
    On Error GoTo Err_DatenbankeigenschaftenExportieren
    
    Close #intDatei
    
    Call LogSchreiben("Datenbankeigenschaften exportiert")
    intExportierteObjekte = intExportierteObjekte + 1

Exit_DatenbankeigenschaftenExportieren:
    Exit Sub
    
Err_DatenbankeigenschaftenExportieren:
    Call FehlerBehandlung("DatenbankeigenschaftenExportieren", Err.Number, Err.Description)
    Resume Exit_DatenbankeigenschaftenExportieren
End Sub

Private Sub OrdnerErstellen(strPfad As String)
    On Error Resume Next
    
    If Dir(strPfad, vbDirectory) = "" Then
        MkDir strPfad
    End If
End Sub

Private Sub LogSchreiben(strNachricht As String)
    On Error Resume Next
    
    Dim strLogDatei As String
    Dim intDatei As Integer
    
    strLogDatei = strExportPfad & "Export_Log.txt"
    
    intDatei = FreeFile
    Open strLogDatei For Append As #intDatei
    Print #intDatei, Format(Now, "hh:nn:ss") & " - " & strNachricht
    Close #intDatei
    
    ' Auch in Direktfenster ausgeben
    Debug.Print Format(Now, "hh:nn:ss") & " - " & strNachricht
End Sub

Private Sub FehlerBehandlung(strProzedur As String, lngFehlerNr As Long, strFehlerText As String)
    Dim strMeldung As String
    
    strMeldung = "Fehler in " & strProzedur & ": " & lngFehlerNr & " - " & strFehlerText
    Call LogSchreiben("FEHLER: " & strMeldung)
    Debug.Print "FEHLER: " & strMeldung
End Sub