!macro customInstall
  # Check if Node.js is installed and get version
  ReadRegStr $R0 HKLM "SOFTWARE\Node.js" "Version"
  ${If} $R0 == ""
    # Node.js not installed - install it
    SetOutPath "$TEMP"
    File "${BUILD_RESOURCES_DIR}\..\nodejs\node.msi"
    ExecShell "open" "$TEMP\node.msi"
    MessageBox MB_OK "Please complete the Node.js installation first, then click OK to continue."
  ${ElseIf} $R0 != "18.18.0"
    # Wrong version - install correct version
    SetOutPath "$TEMP"
    File "${BUILD_RESOURCES_DIR}\..\nodejs\node.msi"
    ExecShell "open" "$TEMP\node.msi"
    MessageBox MB_OK "Please complete the Node.js installation first, then click OK to continue."
  ${EndIf}
  
  # Create startup entry for the server
  CreateShortCut "$SMSTARTUP\KSB-POS-Server.lnk" "$INSTDIR\KSB-POS.exe" "" "$INSTDIR\assets\ksb.ico"
!macroend

!macro customUnInstall 
  # Ask user for confirmation before deleting data
  MessageBox MB_YESNO "Remove application data?" IDYES proceed IDNO abort
  proceed:
    # Remove startup shortcut
    Delete "$SMSTARTUP\KSB-POS-Server.lnk"
    
    # Remove program files but preserve user data
    RMDir /r "$PROGRAMFILES\KSB-POS"
    Delete "$TEMP\KSB-POS-*"
    
    # Clean cache but keep localStorage
    RMDir /r "$APPDATA\KSB-POS\Cache"
    RMDir /r "$APPDATA\KSB-POS\Code Cache"
    RMDir /r "$APPDATA\KSB-POS\GPUCache"
    
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
