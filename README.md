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

## Log

Each run prints `yyyy-MM-dd HH:mm:ss` on every console line and appends the same lines to `disk-space-analysis.log` in the report folder.

PowerShell: `-EventLog`. .NET: `--event-log`. That also writes the start, errors, and the summary to the Windows Application log. The source name is `disk-space-analysis`. The first use must run elevated so Windows can register the source. `-Quiet` / `--quiet` hides console progress. The log file is still written. The periodic file-count lines stay in the console and the log file, not the event log.
