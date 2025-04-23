!macro customInstall  
  # Create startup entry for the server
  CreateShortCut "$SMSTARTUP\KSB-POS-Server.lnk" "$INSTDIR\KSB-POS.exe" "" "$INSTDIR\assets\ksb.ico"
!macroend

!macro customUnInstall
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
