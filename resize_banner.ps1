
Add-Type -AssemblyName System.Drawing

$sourcePath = "c:\Users\Toshiba\Desktop\Percobaan\assets\banner.png"
$targetPath = "c:\Users\Toshiba\Desktop\Percobaan\assets\banner_1002x548.png"
$targetWidth = 1002
$targetHeight = 548

if (-not (Test-Path $sourcePath)) {
    Write-Host "Source file not found: $sourcePath"
    exit 1
}

$image = [System.Drawing.Image]::FromFile($sourcePath)
$newImage = New-Object System.Drawing.Bitmap $targetWidth, $targetHeight
$graphics = [System.Drawing.Graphics]::FromImage($newImage)

$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.DrawImage($image, 0, 0, $targetWidth, $targetHeight)

$newImage.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$newImage.Dispose()
$image.Dispose()

Write-Host "Resized image saved to $targetPath"
