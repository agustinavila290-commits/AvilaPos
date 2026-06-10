' AvilaPOS Launcher - Fase 1 (sin PyInstaller)
' Inicia launcher.py usando pythonw.exe (sin ventana de consola)
' Doble clic para iniciar el sistema.

Option Explicit

Dim WshShell, fso, pythonw, launcherScript, projectRoot

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Raiz del proyecto (dos niveles arriba: este .vbs vive en launcher/)
projectRoot = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
launcherScript = projectRoot & "\launcher\launcher.py"

' Buscar pythonw.exe: primero en el venv, luego en el PATH
Dim pythonwVenv
pythonwVenv = projectRoot & "\backend\venv\Scripts\pythonw.exe"

If fso.FileExists(pythonwVenv) Then
    pythonw = pythonwVenv
Else
    ' Fallback: pythonw del sistema
    pythonw = "pythonw.exe"
End If

' Verificar que el script existe
If Not fso.FileExists(launcherScript) Then
    WshShell.Popup "No se encontro launcher.py en:" & vbCrLf & launcherScript, 0, "AvilaPOS - Error", 16
    WScript.Quit 1
End If

' Ejecutar sin ventana (segundo parametro = 0 oculta la ventana)
WshShell.Run Chr(34) & pythonw & Chr(34) & " " & Chr(34) & launcherScript & Chr(34), 0, False

Set WshShell = Nothing
Set fso = Nothing
