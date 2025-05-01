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
    
    # Clean registry entries
    DeleteRegKey HKCU "Software\KSB-POS"
    DeleteRegKey HKLM "Software\KSB-POS"
    
    # Remove installation directory
    RMDir /r "$INSTDIR"
    
    # Optional: Delete user data
    # NOTE: We're intentionally NOT deleting the AppData directory to preserve the database
    # If you want to give users the option:
    MessageBox MB_YESNO "Удалить также локальную базу данных? (Рекомендуется 'Нет' если вы планируете переустановить приложение)" IDYES deletedata IDNO nodeletions
    deletedata:
      # Delete AppData folder - only if explicitly requested
      RMDir /r "$APPDATA\KSB-POS"
    nodeletions:
    goto done
  abort:
    goto done
  done:
!macroend