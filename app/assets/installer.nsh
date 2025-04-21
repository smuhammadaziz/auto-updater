!macro customInstall
  # Try to close the application if it's running
  ExecWait 'taskkill /f /im KSB-POS.exe' $0
  
  # If the process is still running, notify the user
  FindWindow $0 "" "KSB-POS"
  IntCmp $0 0 processNotRunning
    MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "KSB-POS is still running. Please close it manually and click Retry to continue." IDRETRY retry IDCANCEL abort
    retry:
      ExecWait 'taskkill /f /im KSB-POS.exe' $0
      Sleep 1000
      FindWindow $0 "" "KSB-POS"
      IntCmp $0 0 processNotRunning
        MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "KSB-POS is still running. Please close it manually and click Retry to continue." IDRETRY retry IDCANCEL abort
    abort:
      Abort "Installation canceled by user."
  processNotRunning:
  
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
  # Try to close the application if it's running
  ExecWait 'taskkill /f /im KSB-POS.exe' $0
  
  # If the process is still running, notify the user
  FindWindow $0 "" "KSB-POS"
  IntCmp $0 0 processNotRunningUninstall
    MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "KSB-POS is still running. Please close it manually and click Retry to continue." IDRETRY retryUninstall IDCANCEL abortUninstall
    retryUninstall:
      ExecWait 'taskkill /f /im KSB-POS.exe' $0
      Sleep 1000
      FindWindow $0 "" "KSB-POS"
      IntCmp $0 0 processNotRunningUninstall
        MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "KSB-POS is still running. Please close it manually and click Retry to continue." IDRETRY retryUninstall IDCANCEL abortUninstall
    abortUninstall:
      Abort "Uninstallation canceled by user."
  processNotRunningUninstall:

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