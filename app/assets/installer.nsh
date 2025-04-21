# Include the nsProcess plugin
!include nsProcess.nsh

!macro customInstall
  # First check if application is running and close it
  nsProcess::_FindProcess "KSB-POS.exe"
  Pop $R0
  ${If} $R0 == 0
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "KSB-POS is currently running and needs to be closed before continuing installation. Would you like to close it now?" IDOK closeit IDCANCEL abortinstall
    closeit:
      nsProcess::_KillProcess "KSB-POS.exe"
      Sleep 1000
      nsProcess::_FindProcess "KSB-POS.exe"
      Pop $R0
      ${If} $R0 == 0
        MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "KSB-POS is still running. Please close it manually and click Retry to continue." IDRETRY closeit IDCANCEL abortinstall
      ${EndIf}
      Goto continue
    abortinstall:
      Abort "Installation canceled by user."
    continue:
  ${EndIf}
  
  # Check for any backend Node.js processes that might be running
  nsProcess::_FindProcess "node.exe"
  Pop $R0
  ${If} $R0 == 0
    # Optional: You could add a similar kill process loop here for node.exe
    # But be careful as it might kill other Node.js applications
    # Instead, just warn the user
    MessageBox MB_OK|MB_ICONINFORMATION "Node.js processes are running. If installation fails, please restart your computer and try again."
  ${EndIf}
  
  # Extract Node.js MSI installer to user's temp directory
  SetOutPath "$TEMP"
  File "${BUILD_RESOURCES_DIR}\..\nodejs\node.msi"
  
  # Launch Node.js installer and wait for it to complete
  ExecShell "open" "$TEMP\node.msi"
  MessageBox MB_OK "Please complete the Node.js installation first, then click OK to continue."
  
  # Create startup entry for the server
  CreateShortCut "$SMSTARTUP\KSB-POS-Server.lnk" "$INSTDIR\KSB-POS.exe" "" "$INSTDIR\assets\ksb.ico"
!macroend

!macro customUnInstall
  # First check if application is running and close it
  nsProcess::_FindProcess "KSB-POS.exe"
  Pop $R0
  ${If} $R0 == 0
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "KSB-POS is currently running and needs to be closed before uninstallation. Would you like to close it now?" IDOK closeItUninstall IDCANCEL abortUninstall
    closeItUninstall:
      nsProcess::_KillProcess "KSB-POS.exe"
      Sleep 1000
      nsProcess::_FindProcess "KSB-POS.exe"
      Pop $R0
      ${If} $R0 == 0
        MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "KSB-POS is still running. Please close it manually and click Retry to continue." IDRETRY closeItUninstall IDCANCEL abortUninstall
      ${EndIf}
      Goto continueUninstall
    abortUninstall:
      Abort "Uninstallation canceled by user."
    continueUninstall:
  ${EndIf}

  # Ask user for confirmation before deleting all data
  MessageBox MB_YESNO "Хотите удалить все данные приложения, включая персональные настройки и базу данных?" IDYES proceed IDNO abort
  proceed:
    # Remove startup shortcut
    Delete "$SMSTARTUP\KSB-POS-Server.lnk"
    
    # Remove app data
    RMDir /r "$APPDATA\KSB-POS"
    RMDir /r "$LOCALAPPDATA\KSB-POS"
    
    # Remove program data
    RMDir /r "$PROGRAMFILES\KSB-POS"
    
    # Remove temp files
    Delete "$TEMP\KSB-POS-*"
    
    # Clean up electron cache
    RMDir /r "$APPDATA\KSB-POS\Cache"
    RMDir /r "$APPDATA\KSB-POS\Code Cache"
    RMDir /r "$APPDATA\KSB-POS\GPUCache"
    RMDir /r "$APPDATA\KSB-POS\Local Storage"
    RMDir /r "$APPDATA\KSB-POS\Session Storage"
    
    # Remove logs
    RMDir /r "$APPDATA\KSB-POS\logs"
    Delete "$APPDATA\KSB-POS\*.log"
    
    # Clean registry entries
    DeleteRegKey HKCU "Software\KSB-POS"
    DeleteRegKey HKLM "Software\KSB-POS"
    
    # Remove installation directory
    RMDir /r "$INSTDIR"
    goto done
  abort:
    goto done
  done:
!macroend