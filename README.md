# Disk space analysis for Windows

Scan a folder, a volume, or a UNC path on Windows Server 2016 and later. Same job as Tree Size: folder tree, largest files, file types, age, duplicates, and what changed between two scans.

Two scanners write the same reports. Use PowerShell when the server has no extra runtime. Use SizeTree when you want a single .NET 8 executable.

| Path | What it is |
|---|---|
| `src/Get-DiskAnalysis.ps1` | Windows PowerShell 5.1 scanner |
| `src/Compare-DiskAnalysis.ps1` | Compare two `folders.csv` snapshots |
| `src/SizeTree/` | .NET 8 scanner and compare (`scan` and `compare`) |
| `viewer/` | Browser viewer for `latest.json` and `compare.json` |

Both tools write `latest.json`. Open that file in the viewer.

## PowerShell (no install, Windows PowerShell 5.1)

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\src\Get-DiskAnalysis.ps1 -Path D:\ -OutDir C:\SizeTreeReports -Duplicates -HashDuplicates -AllocatedSize
```

`-AllocatedSize` reads real NTFS allocation, including compressed and sparse files. It is slower because every file is opened for attributes.

`-Depth 3` stops after three levels. Totals then exclude anything deeper. Leave it off for a full volume.

Compare two snapshots. Use the folders CSV, which lists every folder, not only the JSON tree:

```powershell
.\src\Compare-DiskAnalysis.ps1 -Before C:\SizeTreeReports\sizetree-20261006-020000-folders.csv -After C:\SizeTreeReports\latest-folders.csv -OutDir C:\SizeTreeReports\compare
```

Open `compare.json` in the viewer.

## .NET 8

From `src\SizeTree`:

```powershell
dotnet publish .\SizeTree.csproj -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -o .\publish
.\publish\SizeTree.exe scan --path D:\ --out C:\SizeTreeReports --duplicates --hash --allocated
.\publish\SizeTree.exe compare --before C:\SizeTreeReports\older-folders.csv --after C:\SizeTreeReports\latest-folders.csv --out C:\SizeTreeReports\compare
```

If the server does not have the .NET 8 runtime, publish self-contained:

```powershell
dotnet publish .\SizeTree.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o .\publish
```

## Reports

| File | What it is |
|---|---|
| `latest.json` | Viewer report. Tree is capped (`-ExportDepth` / `--export-depth`, default 6) so the file stays usable. Totals still include everything scanned. |
| `latest-folders.csv` | Every folder. This is what compare uses. |
| `latest-files.csv` | Largest files. |
| `latest-extensions.csv` | Space by extension. |
| `latest-ages.csv` | Space by last-write age. |
| `latest-duplicates.csv` | Same-size or SHA-256 groups. |
| `latest-errors.csv` | Access denied and skipped junctions. |
| `latest.html` | Printable summary. |

Junctions and symlinks are not followed. Duplicate tracking ignores files under 256 KB and, by default, under 50 MB. A size match is not proof the bytes match. Add `-HashDuplicates` or `--hash` for SHA-256.

Exclude a name or wildcard:

```powershell
.\src\Get-DiskAnalysis.ps1 -Path D:\Shares -Exclude node_modules,*.tmp
```

```powershell
SizeTree.exe scan --path D:\Shares --exclude "node_modules;*.tmp"
```

## Viewer

`viewer/src` is the report reader: folder tree, treemap, largest files, extensions, age, duplicates, and the compare view. It expects `latest.json` or `compare.json` from either scanner. It is not a standalone project. Drop it into a React app that can resolve `@/lib/disk` and `@/components/disk`.
