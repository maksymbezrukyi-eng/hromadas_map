<#
.SYNOPSIS
  Converts the hromada-selection Excel workbook into data/id_mapping.json
  and data/hromadas_survey.json for the tool's DATA_SOURCE='local' mode.

.DESCRIPTION
  Reads the .xlsx directly as a zip of XML (no Excel/COM, no external
  dependency) so it can run on a plain PowerShell install. Run this by
  hand whenever the workbook is updated, then commit the two JSON files.

  The workbook uses a different hromada numbering ("ID громади", used in
  sheets 01-07) than this tool's own H[].id (which matches the community_id
  used in 10_ЖУРНАЛ_ІМПОРТУ / 06A_ПИТАННЯ_ІНТЕРВЮ, format HROM_XXX). This
  script reconciles the two by matching name+oblast, with one hand-written
  alias for a known rename (Первомайська -> Златопільська). Any hromada
  that still doesn't match on either side is reported, not guessed.

.PARAMETER WorkbookPath
  Path to the .xlsx file.

.PARAMETER RepoRoot
  Path to the hromadas_map repo root. Defaults to the parent of this
  script's directory.

.EXAMPLE
  .\scripts\convert_workbook.ps1 -WorkbookPath "C:\...\Турбота_Workbook...xlsx"
#>
param(
  [Parameter(Mandatory=$true)][string]$WorkbookPath,
  [string]$RepoRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'

# ---- known renames the automatic name+oblast match can't see on its own ----
# "Первомайська" (Харківська) was decommunized to "Златопільська" in the
# workbook; the tool's H array still has the old name. Add future renames
# here rather than guessing at match time.
$aliases = @{ "Первомайська|Харківська" = "Златопільська|Харківська" }

function Norm($s) {
  if ($null -eq $s) { return "" }
  return ($s -replace '\s*\(.*?\)\s*','').Trim()
}

# ---- unzip the workbook ----
$work = Join-Path ([System.IO.Path]::GetTempPath()) ("hromadas_wb_" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $work | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($WorkbookPath, $work)

# ---- shared strings + cell helpers ----
[xml]$ssXml = Get-Content -Raw -Encoding UTF8 (Join-Path $work "xl\sharedStrings.xml")
$sharedStrings = @()
foreach ($si in $ssXml.sst.si) {
  if ($si.t) { $sharedStrings += $si.t.InnerText }
  elseif ($si.r) { $t=""; foreach($r in $si.r){ if($r.t){$t+=$r.t.InnerText} }; $sharedStrings += $t }
  else { $sharedStrings += "" }
}
function Get-Val($c) {
  if ($null -eq $c -or $null -eq $c.v) { return $null }
  if ($c.t -eq "s") { return $sharedStrings[[int]$c.v] }
  if ($c.f -and -not $c.v) { return $null }
  return [string]$c.v
}
function Get-Cell($row, [string]$col) {
  return ($row.c | Where-Object { $_.r -match "^$col\d+$" } | Select-Object -First 1)
}
function Load-Sheet([string]$name) {
  [xml]$x = Get-Content -Raw -Encoding UTF8 (Join-Path $work "xl\worksheets\$name")
  return $x.worksheet.sheetData.row
}

# sheet2=01_СПИСОК_ГРОМАД sheet3=02_ВВЕДЕННЯ_ОПИТУВАЛЬНИКА
# sheet5=04_СКОРИНГ_ОПИТУВАННЯ sheet8=07_ФІНАЛЬНИЙ_РЕЙТИНГ
$rowsList   = Load-Sheet "sheet2.xml"
$rowsEntry  = Load-Sheet "sheet3.xml"
$rowsScore  = Load-Sheet "sheet5.xml"
$rowsRank   = Load-Sheet "sheet8.xml"

# ---- 1. our own H[].id/name/oblast, parsed straight out of js/data.js ----
$dataJsPath = Join-Path $RepoRoot "js\data.js"
$dataJs = Get-Content -Raw -Encoding UTF8 $dataJsPath
$toolRows = @()
foreach ($m in [regex]::Matches($dataJs, 'id:(\d+),n:"([^"]+)",o:"([^"]+)"')) {
  $toolRows += [pscustomobject]@{ id=[int]$m.Groups[1].Value; n=$m.Groups[2].Value; o=$m.Groups[3].Value }
}
if ($toolRows.Count -eq 0) { throw "Could not parse any H[] rows out of $dataJsPath — has its format changed?" }

# ---- 2. workbook's own "ID громади" list (01_СПИСОК_ГРОМАД, scheme W) ----
$wbRows = @()
foreach ($row in $rowsList) {
  if ([int]$row.r -lt 4) { continue }
  $wid = Get-Val (Get-Cell $row 'A')
  if (-not $wid) { continue }
  $wbRows += [pscustomobject]@{
    wid = [int]$wid
    n = Get-Val (Get-Cell $row 'B')
    o = Get-Val (Get-Cell $row 'C')
    us = Get-Val (Get-Cell $row 'G')
    sl = Get-Val (Get-Cell $row 'M')
    interview = Get-Val (Get-Cell $row 'N')
    final = Get-Val (Get-Cell $row 'O')
  }
}

# ---- 3. match tool rows <-> workbook rows by normalized name+oblast ----
$wbByKey = @{}
foreach ($w in $wbRows) { $wbByKey["$(Norm $w.n)|$(Norm $w.o)"] = $w }

$mapping = @()
$usedWid = @{}
foreach ($t in $toolRows) {
  $key = "$(Norm $t.n)|$(Norm $t.o)"
  $w = $wbByKey[$key]
  if (-not $w -and $aliases.ContainsKey($key)) {
    $w = $wbByKey[$aliases[$key]]
  }
  if ($w) {
    $mapping += [pscustomobject]@{ tool_id=$t.id; tool_name=$t.n; workbook_id=$w.wid; workbook_name=$w.n; oblast=$t.o; matched=$true }
    $usedWid[$w.wid] = $true
  } else {
    $mapping += [pscustomobject]@{ tool_id=$t.id; tool_name=$t.n; workbook_id=$null; workbook_name=$null; oblast=$t.o; matched=$false; note="Немає відповідника в 01_СПИСОК_ГРОМАД воркбука" }
  }
}
foreach ($w in $wbRows) {
  if (-not $usedWid.ContainsKey($w.wid)) {
    $mapping += [pscustomobject]@{ tool_id=$null; tool_name=$null; workbook_id=$w.wid; workbook_name=$w.n; oblast=$w.o; matched=$false; note="Є у воркбуку, немає в H[] інструмента" }
  }
}

function Write-JsonNoBom([string]$Path, $Obj) {
  $json = $Obj | ConvertTo-Json -Depth 5
  [System.IO.File]::WriteAllText($Path, $json, (New-Object System.Text.UTF8Encoding($false)))
}

$mappingPath = Join-Path $RepoRoot "data\id_mapping.json"
Write-JsonNoBom $mappingPath $mapping
$unresolved = $mapping | Where-Object { -not $_.matched }
Write-Output "id_mapping.json: $(($mapping | Where-Object matched).Count) зведено, $($unresolved.Count) не зведено."
foreach ($u in $unresolved) { Write-Output ("  НЕ ЗВЕДЕНО: " + ($u | ConvertTo-Json -Compress)) }

# ---- 4. pull survey data for matched hromadas, keyed by workbook_id ----
$scoreByWid = @{}
foreach ($row in $rowsScore) {
  if ([int]$row.r -lt 4) { continue }
  $wid = Get-Val (Get-Cell $row 'A')
  if (-not $wid) { continue }
  $scoreByWid[[int]$wid] = [pscustomobject]@{
    d1 = [double](Get-Val (Get-Cell $row 'K'))
    d1_1 = [double](Get-Val (Get-Cell $row 'G'))
    d1_2 = [double](Get-Val (Get-Cell $row 'H'))
    d1_3 = [double](Get-Val (Get-Cell $row 'I'))
    d1_4 = [double](Get-Val (Get-Cell $row 'J'))
    d2 = [double](Get-Val (Get-Cell $row 'P'))
    d2_1 = [double](Get-Val (Get-Cell $row 'L'))
    d2_2 = [double](Get-Val (Get-Cell $row 'M'))
    d2_3 = [double](Get-Val (Get-Cell $row 'N'))
    d2_4 = [double](Get-Val (Get-Cell $row 'O'))
    d3 = [double](Get-Val (Get-Cell $row 'T'))
    d3_1 = [double](Get-Val (Get-Cell $row 'Q'))
    d3_2 = [double](Get-Val (Get-Cell $row 'R'))
    d3_3 = [double](Get-Val (Get-Cell $row 'S'))
    d4 = [double](Get-Val (Get-Cell $row 'X'))
    d4_1 = [double](Get-Val (Get-Cell $row 'U'))
    d4_2 = [double](Get-Val (Get-Cell $row 'V'))
    d4_3 = [double](Get-Val (Get-Cell $row 'W'))
    d5 = [double](Get-Val (Get-Cell $row 'AA'))
    d5_1 = [double](Get-Val (Get-Cell $row 'Y'))
    d5_2 = [double](Get-Val (Get-Cell $row 'Z'))
    d6 = [double](Get-Val (Get-Cell $row 'AG'))
    d6_1 = [double](Get-Val (Get-Cell $row 'AB'))
    d6_2 = [double](Get-Val (Get-Cell $row 'AC'))
    d6_3 = [double](Get-Val (Get-Cell $row 'AD'))
    d6_4 = [double](Get-Val (Get-Cell $row 'AE'))
    d6_5 = [double](Get-Val (Get-Cell $row 'AF'))
    d4a = [double](Get-Val (Get-Cell $row 'AK'))
    d7_1 = [double](Get-Val (Get-Cell $row 'AH'))
    d7_2 = [double](Get-Val (Get-Cell $row 'AI'))
    d7_3 = [double](Get-Val (Get-Cell $row 'AJ'))
    score_survey = [double](Get-Val (Get-Cell $row 'AL'))
  }
}
$rankByWid = @{}
foreach ($row in $rowsRank) {
  if ([int]$row.r -lt 4) { continue }
  $wid = Get-Val (Get-Cell $row 'A')
  if (-not $wid) { continue }
  $rankByWid[[int]$wid] = [pscustomobject]@{
    final_score = [double](Get-Val (Get-Cell $row 'J'))
    rank = [int](Get-Val (Get-Cell $row 'K'))
    final = Get-Val (Get-Cell $row 'N')
  }
}
$entryByWid = @{}
foreach ($row in $rowsEntry) {
  if ([int]$row.r -lt 4) { continue }
  $wid = Get-Val (Get-Cell $row 'A')
  if (-not $wid) { continue }
  $entryByWid[[int]$wid] = [pscustomobject]@{
    population_survey = [double](Get-Val (Get-Cell $row 'L'))
    children_u1 = [double](Get-Val (Get-Cell $row 'N'))
  }
}

function NZ($v) { if ($null -eq $v -or [double]::IsNaN($v)) { return 0 } ; return $v }

$survey = @()
foreach ($m in ($mapping | Where-Object matched)) {
  $wid = $m.workbook_id
  $wb = $wbRows | Where-Object { $_.wid -eq $wid } | Select-Object -First 1
  $sc = $scoreByWid[$wid]
  $rk = $rankByWid[$wid]
  $en = $entryByWid[$wid]
  $survey += [pscustomobject]@{
    id = $m.tool_id
    us = $wb.us
    sl = $wb.sl
    interview = $wb.interview
    final = if ($rk -and $rk.final) { $rk.final } else { $wb.final }
    score_survey = if ($sc) { NZ $sc.score_survey } else { 0 }
    d1 = if ($sc) { NZ $sc.d1 } else { 0 }
    d1_1 = if ($sc) { NZ $sc.d1_1 } else { 0 }
    d1_2 = if ($sc) { NZ $sc.d1_2 } else { 0 }
    d1_3 = if ($sc) { NZ $sc.d1_3 } else { 0 }
    d1_4 = if ($sc) { NZ $sc.d1_4 } else { 0 }
    d2 = if ($sc) { NZ $sc.d2 } else { 0 }
    d2_1 = if ($sc) { NZ $sc.d2_1 } else { 0 }
    d2_2 = if ($sc) { NZ $sc.d2_2 } else { 0 }
    d2_3 = if ($sc) { NZ $sc.d2_3 } else { 0 }
    d2_4 = if ($sc) { NZ $sc.d2_4 } else { 0 }
    d3 = if ($sc) { NZ $sc.d3 } else { 0 }
    d3_1 = if ($sc) { NZ $sc.d3_1 } else { 0 }
    d3_2 = if ($sc) { NZ $sc.d3_2 } else { 0 }
    d3_3 = if ($sc) { NZ $sc.d3_3 } else { 0 }
    d4 = if ($sc) { NZ $sc.d4 } else { 0 }
    d4_1 = if ($sc) { NZ $sc.d4_1 } else { 0 }
    d4_2 = if ($sc) { NZ $sc.d4_2 } else { 0 }
    d4_3 = if ($sc) { NZ $sc.d4_3 } else { 0 }
    d5 = if ($sc) { NZ $sc.d5 } else { 0 }
    d5_1 = if ($sc) { NZ $sc.d5_1 } else { 0 }
    d5_2 = if ($sc) { NZ $sc.d5_2 } else { 0 }
    d6 = if ($sc) { NZ $sc.d6 } else { 0 }
    d6_1 = if ($sc) { NZ $sc.d6_1 } else { 0 }
    d6_2 = if ($sc) { NZ $sc.d6_2 } else { 0 }
    d6_3 = if ($sc) { NZ $sc.d6_3 } else { 0 }
    d6_4 = if ($sc) { NZ $sc.d6_4 } else { 0 }
    d6_5 = if ($sc) { NZ $sc.d6_5 } else { 0 }
    d4a = if ($sc) { NZ $sc.d4a } else { 0 }
    d7_1 = if ($sc) { NZ $sc.d7_1 } else { 0 }
    d7_2 = if ($sc) { NZ $sc.d7_2 } else { 0 }
    d7_3 = if ($sc) { NZ $sc.d7_3 } else { 0 }
    final_score = if ($rk) { NZ $rk.final_score } else { 0 }
    rank = if ($rk) { NZ $rk.rank } else { 0 }
    population_survey = if ($en) { NZ $en.population_survey } else { 0 }
    children_u1 = if ($en) { NZ $en.children_u1 } else { 0 }
  }
}

$surveyPath = Join-Path $RepoRoot "data\hromadas_survey.json"
Write-JsonNoBom $surveyPath $survey
$withScore = ($survey | Where-Object { $_.score_survey -gt 0 }).Count
$withChildren = ($survey | Where-Object { $_.children_u1 -gt 0 }).Count
Write-Output "hromadas_survey.json: $($survey.Count) громад, $withScore із балом опитування, $withChildren з реальним 'діти до 1 року'."

Remove-Item -Recurse -Force $work
