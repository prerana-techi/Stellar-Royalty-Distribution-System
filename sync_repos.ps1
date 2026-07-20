$workspace = "c:\Users\name\Desktop\Stellar-Royalty-Distribution-System"
$tempDir = Join-Path $workspace "temp_repo_sync"

if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
Set-Location $tempDir

Write-Host "Cloning old repo..."
git clone https://github.com/ashishh-tech/STELLARLEND.git

Write-Host "Cloning new repo..."
git clone https://github.com/ashishh-tech/Stellar-Peer-to-Peer-Lending.git

Write-Host "Replacing contents..."
Get-ChildItem -Path STELLARLEND -Force | Where-Object { $_.Name -ne '.git' } | Remove-Item -Recurse -Force
Get-ChildItem -Path Stellar-Peer-to-Peer-Lending -Force | Where-Object { $_.Name -ne '.git' } | Copy-Item -Destination STELLARLEND -Recurse -Force

Set-Location STELLARLEND
git add .
git commit -m "Update old repo with contents of Stellar-Peer-to-Peer-Lending"
git push

Set-Location $workspace
Write-Host "Cleaning up..."
Remove-Item -Recurse -Force $tempDir
Write-Host "Done!"
