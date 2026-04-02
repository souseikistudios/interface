# Serves the project root so TOKENS, components, and prototypes resolve.
#
# SERVER (PowerShell, from repo root):
#   powershell -ExecutionPolicy Bypass -File .\serve-preview.ps1
#
# CHROME (paste after the server is listening):
#   http://127.0.0.1:8765/components/tabs/tabs.html
#   http://127.0.0.1:8765/components/intelligence-nav/intelligence-nav.html
#   http://127.0.0.1:8765/components/right-click/right-click.html

$port = 8765
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)

# Avoid bind conflict if re-run while a previous instance is still up.
$portAlreadyServing = $false
try {
  $probe = New-Object System.Net.Sockets.TcpClient
  $probe.Connect("127.0.0.1", $port)
  if ($probe.Connected) { $portAlreadyServing = $true }
  $probe.Close()
} catch {
  $portAlreadyServing = $false
}

if ($portAlreadyServing) {
  Write-Host "SERVER · listening: http://127.0.0.1:$port/ (reuse — port already open)"
  Write-Host "Root: $root"
  Write-Host ""
  Write-Host "CHROME · open one of:"
  Write-Host "  http://127.0.0.1:$port/components/tabs/tabs.html"
  Write-Host "  http://127.0.0.1:$port/components/intelligence-nav/intelligence-nav.html"
  Write-Host "  http://127.0.0.1:$port/components/right-click/right-click.html"
  Write-Host ""
  Write-Host "PREVIEW_READY"
  while ($true) { Start-Sleep -Seconds 3600 }
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Prefixes.Add("http://localhost:$port/")
try {
  $listener.Start()
} catch {
  Write-Host "Could not bind localhost + 127.0.0.1 (URL ACL). Retrying 127.0.0.1 only." -ForegroundColor Yellow
  Write-Host $_.Exception.Message
  $listener.Close()
  $listener = [System.Net.HttpListener]::new()
  $listener.Prefixes.Add("http://127.0.0.1:$port/")
  $listener.Start()
}

$rcHtml = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, "components", "right-click", "right-click.html"))
if (-not (Test-Path -LiteralPath $rcHtml -PathType Leaf)) {
  Write-Host "WARN: right-click preview missing at: $rcHtml" -ForegroundColor Yellow
} else {
  Write-Host "OK: right-click preview at: $rcHtml"
}
Write-Host ""

Write-Host "SERVER · listening: http://127.0.0.1:$port/"
Write-Host "Root: $root"
Write-Host ""
Write-Host "CHROME · open one of:"
Write-Host "  http://127.0.0.1:$port/components/tabs/tabs.html"
Write-Host "  http://127.0.0.1:$port/components/intelligence-nav/intelligence-nav.html"
Write-Host "  http://127.0.0.1:$port/components/right-click/right-click.html"
Write-Host ""
Write-Host "Press Ctrl+C to stop the server."
Write-Host ""
Write-Host "PREVIEW_READY"

function Get-ContentType([string]$ext) {
  switch ($ext.ToLowerInvariant()) {
    '.html' { return 'text/html; charset=utf-8' }
    '.css'  { return 'text/css; charset=utf-8' }
    '.svg'  { return 'image/svg+xml' }
    '.js'   { return 'application/javascript; charset=utf-8' }
    '.woff2'{ return 'font/woff2' }
    '.woff' { return 'font/woff' }
    '.ttf'  { return 'font/ttf' }
    '.otf'  { return 'font/otf' }
    default { return 'application/octet-stream' }
  }
}

function Resolve-PreviewFilePath([string]$absolutePathFromUrl) {
  $p = [Uri]::UnescapeDataString($absolutePathFromUrl).Trim()
  while ($p.Length -gt 1 -and $p.EndsWith('/')) {
    $p = $p.Substring(0, $p.Length - 1)
  }
  if ($p -eq '/' -or $p -eq '') {
    $p = '/components/tabs/tabs.html'
  }
  $rel = $p.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
  $full = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $rel))
  if (Test-Path -LiteralPath $full -PathType Container) {
    $leaf = [System.IO.Path]::GetFileName($full.TrimEnd([IO.Path]::DirectorySeparatorChar))
    if ($leaf) {
      $candidate = [System.IO.Path]::Combine($full, "$leaf.html")
      if (Test-Path -LiteralPath $candidate -PathType Leaf) {
        return $candidate
      }
    }
  }
  return $full
}

$rootPrefix = $root.TrimEnd([IO.Path]::DirectorySeparatorChar)

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    $path = $req.Url.AbsolutePath
    $fsPath = Resolve-PreviewFilePath $path

    if (-not (
        $fsPath.StartsWith($rootPrefix + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or
        $fsPath.Equals($rootPrefix, [StringComparison]::OrdinalIgnoreCase)
      )) {
      $res.StatusCode = 403
      $body = [System.Text.Encoding]::UTF8.GetBytes(
        "403 Forbidden`nPath escapes server root.`nURL path: $path`nResolved: $fsPath`nRoot: $rootPrefix"
      )
      $res.ContentType = "text/plain; charset=utf-8"
      $res.ContentLength64 = $body.Length
      $res.OutputStream.Write($body, 0, $body.Length)
    }
    elseif (Test-Path -LiteralPath $fsPath -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($fsPath)
      $res.StatusCode = 200
      $ext = [IO.Path]::GetExtension($fsPath)
      $res.ContentType = Get-ContentType($ext)
      if ($ext -match '^\.(html|css|js)$') {
        $res.Headers.Set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
      }
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    else {
      $res.StatusCode = 404
      $isDir = Test-Path -LiteralPath $fsPath -PathType Container
      $hint = if ($isDir) { " (path is a directory, not a file)" } else { " (file missing)" }
      $diag = @"
404 Not Found$hint

Request path: $path
Resolved to:  $fsPath
Server root:  $rootPrefix

Run serve-preview.ps1 from the repo root (folder that contains components/ and serve-preview.ps1).
Try: http://127.0.0.1:$port/components/right-click/right-click.html
"@
      $body = [System.Text.Encoding]::UTF8.GetBytes($diag)
      $res.ContentType = "text/plain; charset=utf-8"
      $res.ContentLength64 = $body.Length
      $res.OutputStream.Write($body, 0, $body.Length)
      Write-Host "404  $path  ->  $fsPath"
    }
    $res.Close()
  }
}
finally {
  $listener.Stop()
  $listener.Close()
}
