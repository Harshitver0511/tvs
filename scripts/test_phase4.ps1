Write-Host "=== 1. TESTING SECURITY HEADERS ===" -ForegroundColor Cyan
$res = Invoke-WebRequest -Uri "http://localhost:3000/" -Method Get -UseBasicParsing
Write-Host ("X-Frame-Options: " + $res.Headers["X-Frame-Options"])
Write-Host ("X-Content-Type-Options: " + $res.Headers["X-Content-Type-Options"])
Write-Host ("Strict-Transport-Security: " + $res.Headers["Strict-Transport-Security"])
Write-Host ("Referrer-Policy: " + $res.Headers["Referrer-Policy"])
Write-Host ("Permissions-Policy: " + $res.Headers["Permissions-Policy"])
Write-Host ("CSP Header Present: " + ($res.Headers["Content-Security-Policy"] -ne $null))

Write-Host "`n=== 2. TESTING DPDP APPLICATION SUBMISSION WITH ZOD & CONSENT ===" -ForegroundColor Cyan
$body = @{
    name = "Rameshwar Pawar"
    phone = "9823144521"
    aadhaarMasked = "XXXX-XXXX-9821"
    state = "Maharashtra"
    district = "Yavatmal"
    village = "Ralegaon"
    pincode = "445001"
    product = "Tractor Loan (50 HP)"
    requestedAmount = 450000
    cropType = "Cotton (Bt)"
    irrigation = "Borewell & Rainfed"
    areaAcres = 5.2
    plotPolygon = @(
        @(20.1384, 78.3182),
        @(20.1410, 78.3220),
        @(20.1370, 78.3245),
        @(20.1350, 78.3195)
    )
    consents = @(
        @{ purpose = "ekyc"; granted = $true },
        @{ purpose = "satellite_analysis"; granted = $true },
        @{ purpose = "mandi_financial"; granted = $true }
    )
} | ConvertTo-Json -Depth 5

$appRes = Invoke-RestMethod -Uri "http://localhost:3000/api/applications" -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
Write-Host ("App Submission Success: " + $appRes.success)
Write-Host ("Generated Application ID: " + $appRes.applicationId)
Write-Host ("AI Credit Score: " + $appRes.applicant.scoring.score)
Write-Host ("Approved Offer Amount: Rs. " + $appRes.applicant.scoring.offer.approvedAmount)

Write-Host "`n=== 3. TESTING DPDP CONSENTS RETRIEVAL ===" -ForegroundColor Cyan
$cRes = Invoke-RestMethod -Uri "http://localhost:3000/api/consents?phone=9823144521" -Method Get -UseBasicParsing
Write-Host ("Consents Found: " + $cRes.consents.Count)
foreach ($c in $cRes.consents) {
    Write-Host ("  - Purpose: " + $c.purpose + " | GrantedAt: " + $c.grantedAt)
}

Write-Host "`n=== 4. TESTING DPDP CONSENT REVOCATION (SEC 6(4)) ===" -ForegroundColor Cyan
$revokeBody = @{
    phone = "9823144521"
    purpose = "mandi_financial"
    reason = "Withdrawn by borrower test"
} | ConvertTo-Json
$rRes = Invoke-RestMethod -Uri "http://localhost:3000/api/consents" -Method Patch -Body $revokeBody -ContentType "application/json" -UseBasicParsing
Write-Host ("Revocation Response: " + $rRes.message)

Write-Host "`n=== 5. TESTING IMMUTABLE AUDIT TRAIL LOGGING ===" -ForegroundColor Cyan
$auditRes = Invoke-RestMethod -Uri "http://localhost:3000/api/audit" -Method Get -UseBasicParsing
Write-Host ("Total Audit Log Entries: " + $auditRes.totalCount)
$topLogs = $auditRes.logs | Select-Object -First 4
foreach ($l in $topLogs) {
    Write-Host ("  - [" + $l.timestamp + "] Role: " + $l.actorRole + " | Action: " + $l.action + " | Entity: " + $l.entity + ":" + $l.entityId)
}

Write-Host "`n=== 6. TESTING STANDALONE KFS PAGE ===" -ForegroundColor Cyan
$kfsRes = Invoke-WebRequest -Uri ("http://localhost:3000/kfs/" + $appRes.applicationId) -Method Get -UseBasicParsing
Write-Host ("KFS Status Code: " + $kfsRes.StatusCode)
Write-Host ("KFS Contains Key Fact Statement: " + ($kfsRes.Content -match "Key Fact Statement"))
Write-Host ("KFS Contains 3-Day Cooling-Off Period: " + ($kfsRes.Content -match "Cooling-Off Period"))
Write-Host ("KFS Contains Grievance Nodal Officer: " + ($kfsRes.Content -match "Vasudevan"))

Write-Host "`n=== 7. TESTING DPDP CONSENT PORTAL PAGE ===" -ForegroundColor Cyan
$consentPage = Invoke-WebRequest -Uri "http://localhost:3000/consent" -Method Get -UseBasicParsing
Write-Host ("Consent Page Status Code: " + $consentPage.StatusCode)
Write-Host ("Consent Page Contains DPDP Act: " + ($consentPage.Content -match "DPDP ACT 2023"))
Write-Host ("Consent Page Contains Right to Erasure: " + ($consentPage.Content -match "Right to Erasure"))

Write-Host "`n=== 8. TESTING ZOD INVALID INPUT REJECTION (SECURITY BOUNDARY) ===" -ForegroundColor Cyan
$invalidBody = @{
    name = "R" # too short
    phone = "12345" # invalid mobile
    plotPolygon = @(@(0, 0)) # invalid coordinates
} | ConvertTo-Json
try {
    $invRes = Invoke-RestMethod -Uri "http://localhost:3000/api/applications" -Method Post -Body $invalidBody -ContentType "application/json" -UseBasicParsing
    Write-Host "Unexpected success on invalid body" -ForegroundColor Red
} catch {
    Write-Host ("Expected 400 Rejected: " + $_.Exception.Message) -ForegroundColor Green
}
