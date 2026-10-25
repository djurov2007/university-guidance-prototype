# Security Policy

## Supported version

Security fixes are considered for the latest commit on the `main` branch. This repository contains a controlled prototype, not a production admissions service.

## Reporting a vulnerability

Please do not disclose a suspected vulnerability in a public issue, discussion or pull request.

Use GitHub's private vulnerability reporting feature when it is available. Otherwise, contact the repository owner through the GitHub profile associated with this repository and ask for a private reporting channel without including sensitive technical details in the first public message.

Include the affected component, reproduction steps, likely impact and any suggested mitigation. Do not access real user data, attempt denial of service, exceed the invitation and quota controls, or make paid API calls while testing a report.

## Security boundaries

- Only fictional demonstration data is authorised.
- API keys and deployment secrets must remain outside Git and browser code.
- Document upload and real applicant data are disabled.
- The hosted preview is invite-only and rate limited.
- A valid model response is not proof that its factual claims are correct; server-side catalogue and source checks remain authoritative.

See [the security and privacy baseline](docs/security/SECURITY_PRIVACY_BASELINE.md) and [the threat model](docs/security/THREAT_MODEL.md) for the documented prototype scope.
