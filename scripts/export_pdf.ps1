param(
    [string]$pptxFile = "hverma0511_CampusName.pptx",
    [string]$pdfFile = "hverma0511_CampusName.pdf"
)

$currentDir = Get-Location
$fullPptx = Join-Path $currentDir $pptxFile
$fullPdf = Join-Path $currentDir $pdfFile

Write-Host "Converting $fullPptx to $fullPdf..."

try {
    $pp = New-Object -ComObject PowerPoint.Application
    $pres = $pp.Presentations.Open($fullPptx, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    # 32 = ppSaveAsPDF
    $pres.SaveAs($fullPdf, 32)
    $pres.Close()
    $pp.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($pp) | Out-Null
    
    if (Test-Path $fullPdf) {
        $pdfSizeMB = (Get-Item $fullPdf).Length / 1MB
        Write-Host "Successfully generated PDF: $pdfFile ($([Math]::Round($pdfSizeMB, 2)) MB)"
        # Also copy to generic naming
        Copy-Item $fullPdf "TeamName_CampusName.pdf" -Force
        Write-Host "Created generic copy: TeamName_CampusName.pdf"
    } else {
        Write-Warning "PDF file not found after conversion."
    }
} catch {
    Write-Warning "Could not convert via PowerPoint COM: $($_.Exception.Message)"
}
