# disk-space-analysis

Disk space analysis for Windows Server 2016 and later. Same job as Tree Size: folder tree, largest files, file types, age, duplicates, and a compare between two scans.

The maintained repos are:

- [PowerShell](https://github.com/nwlterry/disk_space_analysis-windows-ps) — Windows PowerShell 5.1, no install
- [.NET](https://github.com/nwlterry/disk_space_analysis-windows-dotnet) — portable `disk-space-analysis.exe` for Windows x64

This repo keeps a copy of both sources at v1.0.0-beta.1. The executable is on the .NET release.

```powershell
.\Get-DiskAnalysis.ps1 -Path D:\,E:\ -OutDir C:\disk-space-analysis-reports -Duplicates -HashDuplicates -AllocatedSize
.\disk-space-analysis.exe scan --path D:\ --path E:\Data --out C:\disk-space-analysis-reports --duplicates --hash --allocated
```

`latest.html` opens the scan with no network. Files, Types, and Age list the matching files, and the file name uses most of the row.
