# cleanup stage 36

Archives obvious unused public assets outside `public`, so they remain in the repository but stop shipping to production.

Run from the project root on `dev`:

```powershell
pwsh -ExecutionPolicy Bypass -File tools\cleanup\archive_obvious_unused_public_assets.ps1
```

Then build and commit.
