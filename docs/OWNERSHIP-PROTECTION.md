# Source Code Ownership & Provenance Protection Guide

**Project**: Align Resume Studio  
**Author**: Rahul Kumar  
**Copyright**: © 2026 Rahul Kumar  
**License**: [Proprietary - All Rights Reserved](../LICENSE)  
**Canonical Provenance ID**: `align-resume-studio-core-2026-9a84b2c1`

---

## 1. Overview and Security Principles

Securing intellectual property and proving original authorship in modern software development requires a layered, defense-in-depth approach combining:
1. **Explicit Legal Documentation**: Formal copyright notices and clear license parameters ([`COPYRIGHT.md`](../COPYRIGHT.md)).
2. **Cryptographic Identity Verification**: Cryptographically signed Git commits and signed release tags.
3. **Deterministic State Fingerprints**: Merkle-style SHA-256 source tree manifests recorded over time.
4. **Local Evidence Preservation**: Immutable timestamps and tree snapshots recorded independently of remote platforms.

> **LEGAL & TECHNICAL NOTICE**: Cryptographic signatures and content hashes substantiate source code state, commit authenticity, and authorship provenance at a specific point in time. While invaluable in proving chronological priority and detecting tampering, they do not replace statutory copyright registration or formal employment/client contracts.

---

## 2. Current Git Verification Status in This Repository

An audit of the repository's local Git configuration indicates:
- **Global / Local GPG Signing**: `commit.gpgsign` is currently **unset** (disabled by default in standard Git installations).
- **Existing Commits**: Historical commits in the repository were committed **without cryptographic signatures**.
- **Remote Origin**: Origin is set to `https://github.com/kumarplayground/resume_ai.git` with clean credentials.

To establish verified authorship moving forward, configure commit signing following the instructions below.

---

## 3. Configuring GitHub-Verified Commit Signing

GitHub supports two primary methods for commit signing: **SSH Keys** (modern, simpler to manage) and **GPG Keys**.

> **SECURITY WARNING**:
> - Never share, commit, or expose your private keys (`id_ed25519`, `secring.gpg`, private key files).
> - Only upload **public keys** (`.pub`) to GitHub.
> - Store private keys with a strong passphrase.

### Option A: SSH Commit Signing (Recommended for Simplicity)

Modern Git (version 2.34+) and GitHub natively support signing commits with an SSH key.

#### Step 1: Generate a Dedicated SSH Signing Key
Open PowerShell or your terminal:
```powershell
# Generate a new Ed25519 SSH key specifically for signing
ssh-keygen -t ed25519 -C "kumarplayground12345@gmail.com" -f "$HOME/.ssh/id_ed25519_signing"
```
*(Enter a secure passphrase when prompted).*

#### Step 2: Configure Git to Use SSH for Signing
```powershell
# Set SSH as the signing format
git config --global gpg.format ssh

# Point Git to your public SSH signing key
git config --global user.signingkey "$HOME/.ssh/id_ed25519_signing.pub"

# Enable automatic commit signing for all commits
git config --global commit.gpgsign true

# (Optional) Enable automatic tag signing
git config --global tag.gpgsign true
```

#### Step 3: Add Your SSH Public Key to GitHub
1. Copy the public key to your clipboard:
   ```powershell
   Get-Content "$HOME/.ssh/id_ed25519_signing.pub" | Set-Clipboard
   ```
2. Navigate to [GitHub Settings -> SSH and GPG keys](https://github.com/settings/keys).
3. Click **New SSH key**.
4. In the **Key type** dropdown, select **Signing Key** (do not select Authentication Key).
5. Paste your public key and click **Add SSH key**.

---

### Option B: GPG Commit Signing (Traditional Standard)

If your organization mandates GPG / PGP:

#### Step 1: Install GnuPG
- **Windows**: Install via `winget install GnuPG.GnuPG` or download from [GnuPG.org](https://gnupg.org/).
- **Linux/Ubuntu**: `sudo apt update && sudo apt install gnupg`
- **macOS**: `brew install gnupg`

#### Step 2: Generate GPG Key Pair
```bash
gpg --full-generate-key
```
Select:
- Key type: `(1) RSA and RSA` or `(9) ECC and ECDSA` (Ed25519 recommended).
- Key size: 4096 (for RSA).
- Validity: 1-2 years (with rotation).
- Real Name: `Rahul Kumar`
- Email Address: `kumarplayground12345@gmail.com`

#### Step 3: Extract Key ID and Export Public Key
```bash
# List secret keys to find your key ID (the 16-character hex on the 'sec' line)
gpg --list-secret-keys --keyid-format=long

# Export public key for GitHub
gpg --armor --export <YOUR_KEY_ID>
```

#### Step 4: Configure Git
```bash
git config --global user.signingkey <YOUR_KEY_ID>
git config --global commit.gpgsign true
```
On Windows, you may also need:
```powershell
git config --global gpg.program "C:\Program Files (x86)\GnuPG\bin\gpg.exe"
```

#### Step 5: Add GPG Key to GitHub
Paste the exported ASCII armor block into [GitHub Settings -> SSH and GPG keys -> New GPG Key](https://github.com/settings/keys).

---

## 4. Verifying Signed Commits

Once configured, verify your signature locally before pushing:
```powershell
# Create a test commit
git commit -m "chore: test signed commit"

# Verify the signature of HEAD
git log -1 --show-signature
```
You should see:
```text
Good "git" signature for kumarplayground12345@gmail.com with ED25519 key SHA256:...
```
When pushed to GitHub, commits will display the green **Verified** badge.

---

## 5. Signing Release Tags

For major milestones and official versions, create signed annotated tags:
```powershell
# Create signed tag
git tag -s v1.0.0 -m "Release v1.0.0 - Align Resume Studio Core"

# Push tag to GitHub
git push origin v1.0.0
```

---

## 6. Local Fingerprinting and Evidence Workflow

Before publishing updates or distributing releases, generate and preserve cryptographic evidence:

```powershell
# 1. Generate deterministic source code fingerprints
npm run fingerprint

# 2. Capture Git metadata, commit hashes, and working-tree state
npm run evidence
```

The resulting files in `evidence/`:
- `source-fingerprints.json`: Complete cryptographic manifest of all source files.
- `ownership-evidence.json`: Machine-readable provenance and Git audit report.
- `ownership-evidence.md`: Human-readable summary report.

Store these evidence snapshots in secure backups or timestamped digital archives.
