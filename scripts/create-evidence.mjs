#!/usr/bin/env node
/**
 * Copyright (c) 2026 Rahul Kumar. All rights reserved.
 * Proprietary and confidential. See LICENSE in the project root for details.
 *
 * Evidence Preservation Utility
 * Captures repository provenance, Git state, and cryptographic fingerprints locally.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { generateFingerprints } from "./fingerprint.mjs";

/**
 * Safely executes a git command and returns trimmed stdout, or null on failure.
 */
function getGitOutput(command, cwd) {
  try {
    return execSync(command, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

/**
 * Redacts potential credentials, basic auth tokens, and embedded secrets from git remote URLs.
 */
export function sanitizeRemoteUrl(remoteUrl) {
  if (!remoteUrl) return "None";
  try {
    const parsed = new URL(remoteUrl);
    if (parsed.username || parsed.password) {
      parsed.username = "";
      parsed.password = "";
      return parsed.toString().replace("//@", "//[REDACTED]@");
    }
    return parsed.toString();
  } catch {
    // If not a standard URL (e.g. ssh git@github.com:user/repo.git), scrub any token pattern
    return remoteUrl.replace(/:([^@]+)@/, ":[REDACTED]@");
  }
}

/**
 * Gathers local Git provenance details without fabricating any history or signatures.
 */
function gatherGitProvenance(projectRoot) {
  const isGitRepo = getGitOutput("git rev-parse --is-inside-work-tree", projectRoot) === "true";
  if (!isGitRepo) {
    return {
      isGitRepository: false,
      notice: "Directory is not a recognized Git repository.",
    };
  }

  const commitHash = getGitOutput("git rev-parse HEAD", projectRoot) || "UNKNOWN";
  const branch = getGitOutput("git rev-parse --abbrev-ref HEAD", projectRoot) || "UNKNOWN";
  const rawRemote = getGitOutput("git remote get-url origin", projectRoot) ||
                    getGitOutput("git config --get remote.origin.url", projectRoot) || "";
  const sanitizedRemote = sanitizeRemoteUrl(rawRemote);

  const statusPorcelain = getGitOutput("git status --porcelain", projectRoot) || "";
  const hasUncommittedChanges = statusPorcelain.length > 0;
  const uncommittedFilesCount = hasUncommittedChanges ? statusPorcelain.split("\n").filter(Boolean).length : 0;

  // Check signature status of latest commit (%G? gives 'G'=good, 'B'=bad, 'U'=unknown validity, 'N'=no signature)
  const signatureStatusRaw = getGitOutput('git log -1 --format="%G?|%GK|%GS"', projectRoot);
  let signatureInfo = { isSigned: false, status: "UNSIGNED" };
  if (signatureStatusRaw) {
    const [flag, key, signer] = signatureStatusRaw.split("|");
    if (flag === "G" || flag === "U") {
      signatureInfo = { isSigned: true, status: flag === "G" ? "VALID_SIGNATURE" : "UNVERIFIED_KEY", key, signer };
    } else {
      signatureInfo = { isSigned: false, status: "UNSIGNED_COMMIT" };
    }
  }

  const lastCommitInfo = getGitOutput('git log -1 --pretty=format:"%an <%ae> on %ad - %s"', projectRoot);

  return {
    isGitRepository: true,
    commitHash,
    branch,
    remoteUrl: sanitizedRemote,
    hasUncommittedChanges,
    uncommittedFilesCount,
    signatureInfo,
    lastCommit: lastCommitInfo || "N/A",
  };
}

/**
 * Creates and writes an evidence preservation report.
 */
export async function createEvidence(options = {}) {
  const projectRoot = path.resolve(options.root || ".");
  const evidenceDir = path.resolve(projectRoot, "evidence");

  console.log("[evidence] Step 1/3: Generating source code fingerprint manifest...");
  const fingerprintResult = await generateFingerprints({
    root: projectRoot,
    out: path.join(evidenceDir, "source-fingerprints.json"),
  });

  console.log("[evidence] Step 2/3: Gathering repository provenance & Git integrity state...");
  const gitData = gatherGitProvenance(projectRoot);
  const captureTimestampUtc = new Date().toISOString();

  const evidenceReport = {
    reportType: "Source Code Ownership & Integrity Evidence",
    version: "1.0.0",
    project: "Align Resume Studio",
    author: "Rahul Kumar",
    copyright: "© 2026 Rahul Kumar",
    license: "Proprietary",
    provenanceIdentifier: "align-resume-studio-core-2026-9a84b2c1",
    capturedAtUtc: captureTimestampUtc,
    git: gitData,
    fingerprint: {
      algorithm: fingerprintResult.manifest.algorithm,
      totalFiles: fingerprintResult.manifest.totalFiles,
      rootHash: fingerprintResult.manifest.rootHash,
      manifestPath: "evidence/source-fingerprints.json",
    },
    legalDisclaimer:
      "LEGAL & TECHNICAL NOTICE: This evidence report, cryptographic fingerprints, and git tree snapshot " +
      "record and substantiate code state, content integrity, and local repository metadata at a specific timestamp. " +
      "They provide technical proof of existence and non-tampering but do not independently grant or prove statutory " +
      "copyright ownership under applicable international or domestic copyright statutes.",
  };

  await fs.mkdir(evidenceDir, { recursive: true });

  const jsonReportPath = path.join(evidenceDir, "ownership-evidence.json");
  await fs.writeFile(jsonReportPath, JSON.stringify(evidenceReport, null, 2) + "\n", "utf8");

  // Also write an easily readable Markdown report
  const mdReportPath = path.join(evidenceDir, "ownership-evidence.md");
  const mdContent = `# Ownership & Integrity Evidence Report

- **Project**: ${evidenceReport.project}
- **Author**: ${evidenceReport.author}
- **Copyright**: ${evidenceReport.copyright}
- **License**: [${evidenceReport.license}](LICENSE)
- **Provenance ID**: \`${evidenceReport.provenanceIdentifier}\`
- **Captured At (UTC)**: \`${evidenceReport.capturedAtUtc}\`

---

## 1. Cryptographic Digest Summary
- **Hash Algorithm**: ${evidenceReport.fingerprint.algorithm.toUpperCase()} (with LF line normalization)
- **Deterministic Root Hash**: \`${evidenceReport.fingerprint.rootHash}\`
- **Eligible Source Files Count**: ${evidenceReport.fingerprint.totalFiles}
- **Manifest File**: [\`source-fingerprints.json\`](source-fingerprints.json)

---

## 2. Git Repository Provenance
- **Repository Tracked**: ${gitData.isGitRepository ? "Yes" : "No"}
- **Current Branch**: \`${gitData.branch}\`
- **HEAD Commit**: \`${gitData.commitHash}\`
- **Latest Commit**: ${gitData.lastCommit}
- **Commit Signature**: \`${gitData.signatureInfo.status}\` (${gitData.signatureInfo.isSigned ? "Signed" : "Not signed"})
- **Working Tree Clean**: ${gitData.hasUncommittedChanges ? `No (${gitData.uncommittedFilesCount} modified/untracked files)` : "Yes (Clean)"}
- **Remote Origin URL**: \`${gitData.remoteUrl}\`

---

## 3. Legal and Integrity Notice
> **IMPORTANT**: This evidence report and associated cryptographic manifests substantiate source code integrity, state, and historical existence at a specific moment in time. They serve as reliable digital evidence against post-hoc tampering or unilateral alteration claims, but do not independently constitute statutory copyright registration or replace formal intellectual property agreements.
`;

  await fs.writeFile(mdReportPath, mdContent, "utf8");

  console.log("[evidence] Step 3/3: Preserving evidence files...");
  console.log(`[evidence] Evidence JSON: ${jsonReportPath}`);
  console.log(`[evidence] Evidence Markdown: ${mdReportPath}`);
  console.log(`[evidence] Root Hash: ${evidenceReport.fingerprint.rootHash}`);

  return {
    evidenceReport,
    jsonReportPath,
    mdReportPath,
  };
}

// CLI Execution Handler
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  createEvidence()
    .then(() => {
      console.log("[evidence] Preservation complete.");
    })
    .catch((err) => {
      console.error("[evidence] Error preserving evidence:", err);
      process.exit(1);
    });
}
