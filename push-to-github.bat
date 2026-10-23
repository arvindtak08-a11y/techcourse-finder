@echo off
title TechCourse Finder - Upload to GitHub
echo ========================================================
echo   TechCourse Finder - Sync and Upload to GitHub
echo ========================================================
echo.
cd /d "C:\Users\Arvind Tak\OneDrive\Documents"

echo Checking repository status...
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "Upload 5,050 courses and website v2.0" 2>nul

echo.
echo ========================================================
echo Uploading 5,050 courses to your GitHub repository...
echo If a GitHub popup opens in your browser, click 'Authorize'.
echo ========================================================
echo.

"C:\Program Files\Git\cmd\git.exe" push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   SUCCESS! All 5,050 courses are now uploaded to GitHub!
    echo   Your website will update at:
    echo   https://arvindtak08-a11y.github.io/techcourse-finder/
    echo ========================================================
) else (
    echo ========================================================
    echo   If GitHub asked you to sign in, please complete the
    echo   sign-in in your browser, then run this file again.
    echo ========================================================
)
echo.
pause
