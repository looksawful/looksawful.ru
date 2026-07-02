# refactor round 1 audit

## checks
- ok: runtime entry
- ok: mount registry file
- ok: mount engine file
- ok: round1 css imported
- ok: mobile header-only css
- ok: compact rail css
- ok: before-after direct duplicate removed
- ok: media slider auto-init removed

## metrics
- petIframes: 3
- mediaGroups: 16
- mobileRailsLegacy: 15
- portfolioToc: 13
- siteHeaderComponentAttr: 1

## next high-risk areas
- pet iframes on the main page still need replacement with internal preview components.
- typography map and media map still need full structural migration, not only CSS overrides.
- playlist filter is still a monolith and should be split after runtime stabilization.
