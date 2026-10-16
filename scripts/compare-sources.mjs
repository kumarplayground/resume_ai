#!/usr/bin/env node
/**
 * Copyright (c) 2026 Rahul Kumar. All rights reserved.
 * Proprietary and confidential. See LICENSE in the project root for details.
 *
 * Local Source Code Comparison & Copy Detection Utility
 * Compares two source trees offline to identify exact hash matches and text similarity.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const TEXT_EXTENSIONS = new Set([
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
  ".md",
  ".txt",
]);

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

const EXCLUDED_FILES = [
  /^\.env(\..*)?$/i,
  /\.(pem|key|pfx|p12|cert|crt)$/i,
  /\.tsbuildinfo$/i,
  /^next-env\.d\.ts$/i,
  /^package-lock\.json$/i,
  /^source-fingerprints\.json$/i,
  /^ownership-evidence\.json$/i,
];

function normalizePath(p) {
  return p.split(path.sep).join("/");
}

function isExcludedFile(fileName, relPath) {
  for (const pattern of EXCLUDED_FILES) {
    if (pattern.test(fileName)) return true;
  }
  if (relPath.startsWith("evidence/")) return true;
  return false;
}

async function scanDirectory(rootDir, currentDir = rootDir, map = new Map()) {
  let entries;
  try {
    entries = await fs.readdir(currentDir, { withFileTypes: true });
  } catch (err) {
    console.warn(`[compare] Warning: Cannot read ${currentDir}: ${err.message}`);
    return map;
  }

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = normalizePath(path.relative(rootDir, fullPath));

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      await scanDirectory(rootDir, fullPath, map);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext)) continue;
      if (isExcludedFile(entry.name, relPath)) continue;

      try {
        const raw = await fs.readFile(fullPath);
        const text = raw.toString("utf8");
        const canonical = text.replace(/\r\n/g, "\n");
        const hash = crypto.createHash("sha256").update(Buffer.from(canonical, "utf8")).digest("hex");
        map.set(relPath, {
          relPath,
          fullPath,
          ext,
          sha256: hash,
          content: canonical,
          size: raw.length,
        });
      } catch (e) {
        console.warn(`[compare] Warning reading ${relPath}: ${e.message}`);
      }
    }
  }

  return map;
}

/**
 * Computes Jaccard token similarity between two text source strings.
 * Filters common single-character tokens to focus on identifier / keyword patterns.
 */
function computeTokenSimilarity(textA, textB) {
  const tokenize = (text) => {
    const tokens = text.match(/[A-Za-z0-9_$]{3,}/g) || [];
    return new Set(tokens);
  };

  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
  if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

  let intersectionCount = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) {
      intersectionCount++;
    }
  }

  const unionSize = tokensA.size + tokensB.size - intersectionCount;
  return unionSize > 0 ? intersectionCount / unionSize : 0.0;
}

/**
 * Compares two directories and generates comparison results.
 */
export async function compareDirectories(dirA, dirB, options = {}) {
  const threshold = options.threshold ?? 0.65;
  const absA = path.resolve(dirA);
  const absB = path.resolve(dirB);

  console.log(`[compare] Scanning Directory A: ${absA}`);
  const mapA = await scanDirectory(absA);

  console.log(`[compare] Scanning Directory B: ${absB}`);
  const mapB = await scanDirectory(absB);

  const exactMatches = [];
  const modifiedMatches = [];
  const contentMatchesDiffPath = [];
  const similarFiles = [];
  const uniqueToA = [];
  const uniqueToB = [];

  // Index mapB by hash for quick lookups of relocated identical files
  const hashToBEntries = new Map();
  for (const [relPath, itemB] of mapB.entries()) {
    if (!hashToBEntries.has(itemB.sha256)) {
      hashToBEntries.set(itemB.sha256, []);
    }
    hashToBEntries.get(itemB.sha256).push(itemB);
  }

  const processedBPaths = new Set();

  for (const [relPathA, itemA] of mapA.entries()) {
    if (mapB.has(relPathA)) {
      const itemB = mapB.get(relPathA);
      processedBPaths.add(relPathA);

      if (itemA.sha256 === itemB.sha256) {
        exactMatches.push({
          path: relPathA,
          sha256: itemA.sha256,
          sizeBytes: itemA.size,
        });
      } else {
        const similarity = computeTokenSimilarity(itemA.content, itemB.content);
        modifiedMatches.push({
          path: relPathA,
          hashA: itemA.sha256,
          hashB: itemB.sha256,
          similarity: Math.round(similarity * 100),
        });
      }
    } else {
      // Check if file exists at another path with identical hash
      if (hashToBEntries.has(itemA.sha256)) {
        const matchingB = hashToBEntries.get(itemA.sha256)[0];
        processedBPaths.add(matchingB.relPath);
        contentMatchesDiffPath.push({
          pathA: relPathA,
          pathB: matchingB.relPath,
          sha256: itemA.sha256,
        });
      } else {
        uniqueToA.push(relPathA);
      }
    }
  }

  for (const [relPathB] of mapB.entries()) {
    if (!processedBPaths.has(relPathB) && !mapA.has(relPathB)) {
      uniqueToB.push(relPathB);
    }
  }

  // Check cross-path similarity for unique files if requested
  if (options.deepSimilarity) {
    for (const relA of uniqueToA) {
      const itemA = mapA.get(relA);
      for (const relB of uniqueToB) {
        const itemB = mapB.get(relB);
        const sim = computeTokenSimilarity(itemA.content, itemB.content);
        if (sim >= threshold) {
          similarFiles.push({
            pathA: relA,
            pathB: relB,
            similarity: Math.round(sim * 100),
          });
        }
      }
    }
  }

  return {
    dirA: absA,
    dirB: absB,
    totalFilesInA: mapA.size,
    totalFilesInB: mapB.size,
    exactMatches,
    contentMatchesDiffPath,
    modifiedMatches,
    similarFiles,
    uniqueToA,
    uniqueToB,
  };
}

// CLI Execution Handler
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  if (args.length < 2 || args.includes("--help") || args.includes("-h")) {
    console.log(`
Align Resume Studio - Local Source Code Comparison Utility
Usage:
  node scripts/compare-sources.mjs <dirA> <dirB> [options]

Options:
  --threshold <float>   Token similarity threshold (default: 0.65)
  --deep                Enable cross-path token similarity check for unique files
  --json                Output comparison in raw JSON format
  --help, -h            Show this help dialog
`);
    process.exit(0);
  }

  const dirA = args[0];
  const dirB = args[1];
  const isJson = args.includes("--json");
  const deepSimilarity = args.includes("--deep");
  let threshold = 0.65;
  const threshIndex = args.indexOf("--threshold");
  if (threshIndex !== -1 && args[threshIndex + 1]) {
    threshold = parseFloat(args[threshIndex + 1]);
  }

  compareDirectories(dirA, dirB, { threshold, deepSimilarity })
    .then((result) => {
      if (isJson) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(`\n======================================================`);
      console.log(`SOURCE CODE COMPARISON AUDIT`);
      console.log(`Directory A : ${result.dirA} (${result.totalFilesInA} files)`);
      console.log(`Directory B : ${result.dirB} (${result.totalFilesInB} files)`);
      console.log(`======================================================\n`);

      console.log(`1. Exact SHA-256 Matches (${result.exactMatches.length} files):`);
      if (result.exactMatches.length === 0) {
        console.log(`   (No identical files found)`);
      } else {
        result.exactMatches.slice(0, 10).forEach((m) => console.log(`   [EXACT] ${m.path}`));
        if (result.exactMatches.length > 10) {
          console.log(`   ... and ${result.exactMatches.length - 10} more exact matches.`);
        }
      }

      if (result.contentMatchesDiffPath.length > 0) {
        console.log(`\n2. Identical Content at Different Paths (${result.contentMatchesDiffPath.length} files):`);
        result.contentMatchesDiffPath.forEach((m) =>
          console.log(`   [RELOCATED] ${m.pathA} <==> ${m.pathB}`)
        );
      }

      console.log(`\n3. Modified Files at Same Relative Path (${result.modifiedMatches.length} files):`);
      if (result.modifiedMatches.length === 0) {
        console.log(`   (None)`);
      } else {
        result.modifiedMatches.forEach((m) => {
          console.log(`   [MODIFIED] ${m.path} -> ${m.similarity}% token similarity`);
        });
      }

      if (result.similarFiles.length > 0) {
        console.log(`\n4. Cross-Path Similar Files (${result.similarFiles.length} pairs):`);
        result.similarFiles.forEach((m) => {
          console.log(`   [SIMILAR] ${m.pathA} vs ${m.pathB} -> ${m.similarity}% similarity`);
        });
      }

      console.log(`\n5. Structural Summary:`);
      console.log(`   Unique to Directory A: ${result.uniqueToA.length} files`);
      console.log(`   Unique to Directory B: ${result.uniqueToB.length} files`);

      console.log(`\nLEGAL & TECHNICAL NOTICE:`);
      console.log(
        `Token and line similarities indicate structural resemblance and potential code reuse.`
      );
      console.log(`They do not independently constitute statutory proof of copyright infringement.`);
      console.log(`======================================================\n`);
    })
    .catch((err) => {
      console.error(`[compare] Comparison failed:`, err);
      process.exit(1);
    });
}
