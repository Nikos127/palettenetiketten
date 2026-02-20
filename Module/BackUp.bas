Public Function db_backup()
Dim sourceFile As String, destinationFile As String
Dim aFSO As Variant
Dim path As String, name As String
Dim lngNummer As Long

sourceFile = CurrentProject.FullName
path = CurrentProject.path
name = CurrentProject.name
destinationFile = path & "\Sicherung\" & Left(name, Len(name) - 6) & "_" & _
        Year(Now) & "-" & Month(Now) & "-" & Day(Now) & ".accdb"
        
        
If Dir(destinationFile) = "" Then

Set aFSO = CreateObject("Scripting.FileSystemObject")
aFSO.CopyFile sourceFile, destinationFile, True

Else
        While Dir(destinationFile) <> ""
        lngNummer = lngNummer + 1
        destinationFile = path & "\Sicherung\" & Left(name, Len(name) - 6) & "_" & _
        Year(Now) & "-" & Month(Now) & "-" & Day(Now) & "(" & lngNummer & ")" & ".accdb"
        Wend

Set aFSO = CreateObject("Scripting.FileSystemObject")
aFSO.CopyFile sourceFile, destinationFile, True

DoCmd.Quit acSave

End If

End Function