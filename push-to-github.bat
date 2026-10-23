@echo off
echo ========================================================
echo   TechCourse Finder - Sync and Push to GitHub
echo ========================================================
echo.
cd /d "%~dp0"
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "Update TechCourse Finder v2.0"
echo.
echo Pushing to GitHub repository (arvindtak08-a11y/techcourse-finder)...
echo If a GitHub login window appears, please sign in.
echo.
"C:\Program Files\Git\cmd\git.exe" push origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   SUCCESS! All files have been uploaded to GitHub!
    echo ========================================================
) else (
    echo.
    echo If the push did not complete, you may need to log in to GitHub in your browser.
)
pause
