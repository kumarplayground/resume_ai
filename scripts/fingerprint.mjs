#!/usr/bin/env node
/**
 * Copyright (c) 2026 Rahul Kumar. All rights reserved.
 * Proprietary and confidential. See LICENSE in the project root for details.
 *
 * Source Code Fingerprint Generator
 * Deterministically computes SHA-256 digests across project source files.
 * Designed to provide cryptographic verification of source tree integrity.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

// Default allowed extensions for source files
const DEFAULT_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".css",
  ".scss",
  ".mjs",
  ".cjs",
  ".json",
  ".py",
]);

// Directories to strictly exclude from fingerprinting
const EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "build",
  "dist",
  "out",
  "coverage",
  ".venv",
  "venv",
  "env",
  "ENV",
  "__pycache__",
  ".idea",
  ".vscode",
  ".turbo",
  ".vercel",
  "evidence",
  ".tempmediaStorage",
]);

// File patterns and filenames to strictly exclude (secrets, caches, build artifacts)
const EXCLUDED_FILE_PATTERNS = [
  /^\.env(\..*)?$/i,                // Any .env, .env.local, etc.
  /\.(pem|key|pfx|p12|cert|crt)$/i, // Certificates and private keys
  /\.tsbuildinfo$/i,                // TypeScript build caches
  /^next-env\.d\.ts$/i,             // Next.js auto-generated ambient file
  /^package-lock\.json$/i,          // Dependency lockfile (regenerated per npm install)
  /^source-fingerprints\.json$/i,   // Output manifest itself
  /^ownership-evidence\.json$/i,    // Ownership evidence output
];

/**
 * Normalizes any OS path into standard POSIX format with forward slashes.
 */
export function normalizePath(p) {
  return p.split(path.sep).join("/");
}

/**
 * Checks if a given filename or relative path is excluded.
 */
export function isExcludedFile(fileName, relativePath) {
  for (const pattern of EXCLUDED_FILE_PATTERNS) {
    if (pattern.test(fileName)) {
      return true;
    }
  }
  // Exclude anything inside the evidence directory
  if (relativePath.startsWith("evidence/")) {
    return true;
  }
  return false;
}

/**
 * Computes deterministic SHA-256 for a file.
 * Normalizes Windows CRLF to standard LF for text files to ensure identical
 * cryptographic digests across different operating systems and git checkouts.
 */
export async function hashFile(absolutePath, ext) {
  const buffer = await fs.readFile(absolutePath);
  
  // For text/source files, canonicalize line endings (\r\n -> \n)
  let contentToHash = buffer;
  const isTextSource = DEFAULT_EXTENSIONS.has(ext) && ext !== ".p12";
  if (isTextSource) {
    const text = buffer.toString("utf8");
    const canonicalText = text.replace(/\r\n/g, "\n");
    contentToHash = Buffer.from(canonicalText, "utf8");
  }

  const hash = crypto.createHash("sha256").update(contentToHash).digest("hex");
  return {
    sha256: hash,
    sizeBytes: buffer.length,
  };
}

/**
 * Recursively scans directory and collects eligible source files.
 */
async function collectFiles(rootDir, currentDir = rootDir, results = []) {
  let entries;
  try {
    entries = await fs.readdir(currentDir, { withFileTypes: true });
  } catch (err) {
    console.error(`[fingerprint] Warning: Unable to read directory ${currentDir}: ${err.message}`);
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = normalizePath(path.relative(rootDir, fullPath));

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }
      await collectFiles(rootDir, fullPath, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!DEFAULT_EXTENSIONS.has(ext)) {
        continue;
      }
      if (isExcludedFile(entry.name, relPath)) {
        continue;
      }
      results.push({
        absolutePath: fullPath,
        relativePath: relPath,
        ext,
      });
    }
  }

  return results;
}

/**
 * Generates the deterministic fingerprint manifest.
 */
export async function generateFingerprints(options = {}) {
  const rootDir = path.resolve(options.root || ".");
  const outputPath = options.out
    ? path.resolve(options.out)
    : path.resolve(rootDir, "evidence", "source-fingerprints.json");

  const collected = await collectFiles(rootDir);

  // Sort files strictly by normalized relative path for determinism
  collected.sort((a, b) => (a.relativePath < b.relativePath ? -1 : a.relativePath > b.relativePath ? 1 : 0));

  const filesManifest = [];
  const rootHashHasher = crypto.createHash("sha256");

  for (const item of collected) {
    try {
      const { sha256, sizeBytes } = await hashFile(item.absolutePath, item.ext);
      filesManifest.push({
        path: item.relativePath,
        sha256,
        sizeBytes,
      });
      // Deterministically feed relativePath + sha256 into rootHash
      rootHashHasher.update(`${item.relativePath}:${sha256}\n`, "utf8");
    } catch (err) {
      console.error(`[fingerprint] Error hashing ${item.relativePath}: ${err.message}`);
    }
  }

  const rootHash = rootHashHasher.digest("hex");

  const manifest = {
    manifestVersion: "1.0.0",
    author: "Rahul Kumar",
    copyright: "© 2026 Rahul Kumar",
    license: "Proprietary",
    algorithm: "sha256",
    lineNormalization: "LF",
    totalFiles: filesManifest.length,
    rootHash,
    files: filesManifest,
  };

  // Ensure output directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  // Write deterministic formatted JSON
  await fs.writeFile(outputPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  return {
    manifest,
    outputPath,
  };
}

// CLI Execution Handler
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  let outIndex = args.indexOf("--out");
  let outPath = outIndex !== -1 ? args[outIndex + 1] : undefined;

  let rootIndex = args.indexOf("--root");
  let rootPath = rootIndex !== -1 ? args[rootIndex + 1] : undefined;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Align Resume Studio - Source Code Fingerprint Generator
Usage:
  node scripts/fingerprint.mjs [options]

Options:
  --out <path>    Specify output manifest path (default: evidence/source-fingerprints.json)
  --root <dir>    Specify root project directory (default: current directory)
  --help, -h      Display this help dialog
`);
    process.exit(0);
  }

  generateFingerprints({ out: outPath, root: rootPath })
    .then(({ manifest, outputPath }) => {
      console.log(`[fingerprint] Fingerprint generation complete.`);
      console.log(`[fingerprint] Files hashed: ${manifest.totalFiles}`);
      console.log(`[fingerprint] Deterministic Root SHA-256: ${manifest.rootHash}`);
      console.log(`[fingerprint] Manifest saved to: ${outputPath}`);
    })
    .catch((err) => {
      console.error(`[fingerprint] Fatal error:`, err);
      process.exit(1);
    });
}
