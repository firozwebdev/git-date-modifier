#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Load environment variables
require("dotenv").config();

// Simple progress bar implementation
class SimpleProgressBar {
  constructor(format, options = {}) {
    this.format = format;
    this.total = options.total || 100;
    this.current = 0;
    this.width = options.width || 40;
    this.complete = options.complete || "█";
    this.incomplete = options.incomplete || "░";
  }

  tick(amount = 1) {
    this.current += amount;
    this.render();
  }

  update(ratio) {
    this.current = Math.floor(this.total * ratio);
    this.render();
  }

  render() {
    const percent = Math.min(100, (this.current / this.total) * 100);
    const filled = Math.floor((this.current / this.total) * this.width);
    const empty = this.width - filled;

    const bar = this.complete.repeat(filled) + this.incomplete.repeat(empty);
    const formatted = this.format
      .replace(":bar", bar)
      .replace(":current", this.current)
      .replace(":total", this.total)
      .replace(":percent", `${percent.toFixed(1)}%`)
      .replace(":etas", this.calculateETA());

    process.stdout.write(`\r${formatted}`);
  }

  calculateETA() {
    // Simple ETA calculation
    return "--:--";
  }

  finish() {
    this.current = this.total;
    this.render();
    process.stdout.write("\n");
  }
}

// Configuration class
class GitCompressorConfig {
  constructor() {
    this.sourceDir = process.env.SOURCE_DIR || "./source";
    this.outputDir = process.env.OUTPUT_DIR || "./destination";
    this.startDate = process.env.START_DATE || "2025-06-18T09:00:00";
    this.endDate = process.env.END_DATE || null;
    this.compressionRatio = process.env.COMPRESSION_RATIO
      ? parseFloat(process.env.COMPRESSION_RATIO)
      : null;
    this.originalDays = process.env.ORIGINAL_DAYS
      ? parseFloat(process.env.ORIGINAL_DAYS)
      : null;
    this.targetDays = process.env.TARGET_DAYS
      ? parseFloat(process.env.TARGET_DAYS)
      : null;
    this.backupOriginal = process.env.BACKUP_ORIGINAL === "true";
    this.verbose = process.env.VERBOSE === "true";
    this.dryRun = process.env.DRY_RUN === "true";
    this.force = process.env.FORCE === "true";
  }

  validate() {
    const errors = [];

    if (!fs.existsSync(this.sourceDir)) {
      errors.push(`Source directory '${this.sourceDir}' does not exist.`);
    }

    if (
      this.compressionRatio &&
      (this.compressionRatio <= 0 || this.compressionRatio > 1)
    ) {
      errors.push("Compression ratio must be between 0 and 1.");
    }

    if (this.originalDays && this.originalDays <= 0) {
      errors.push("Original days must be positive.");
    }

    if (this.targetDays && this.targetDays <= 0) {
      errors.push("Target days must be positive.");
    }

    if (this.startDate && !this.isValidDate(this.startDate)) {
      errors.push("Start date must be a valid ISO date string.");
    }

    if (this.endDate && !this.isValidDate(this.endDate)) {
      errors.push("End date must be a valid ISO date string.");
    }

    return errors;
  }

  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  calculateCompressionRatio() {
    if (this.compressionRatio) return this.compressionRatio;
    if (this.originalDays && this.targetDays)
      return this.targetDays / this.originalDays;
    return null;
  }
}

// Git History Compressor class
class GitHistoryCompressor {
  constructor(config) {
    this.config = config;
    this.stats = {
      totalCommits: 0,
      processedCommits: 0,
      errors: 0,
      startTime: null,
      endTime: null,
    };
  }

  log(message, level = "info") {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (level === "error") {
      console.error(`\n${prefix} ${message}`);
    } else if (level === "warn") {
      console.warn(`\n${prefix} ${message}`);
    } else if (this.config.verbose || level === "info") {
      console.log(`\n${prefix} ${message}`);
    }
  }

  async run() {
    try {
      this.stats.startTime = new Date();
      this.log("🚀 Starting Git Timeline Compression Engine", "info");
      this.log(
        `Configuration: ${JSON.stringify(this.config, null, 2)}`,
        "debug"
      );

      // Validate configuration
      const errors = this.config.validate();
      if (errors.length > 0) {
        throw new Error(`Configuration errors:\n${errors.join("\n")}`);
      }

      // Calculate compression ratio
      const compressionRatio = this.config.calculateCompressionRatio();
      if (!compressionRatio) {
        throw new Error(
          "Unable to calculate compression ratio. Please provide COMPRESSION_RATIO, ORIGINAL_DAYS and TARGET_DAYS, or ORIGINAL_DAYS and END_DATE."
        );
      }

      this.log(`Compression ratio: ${compressionRatio.toFixed(3)}`, "info");

      // Copy source files (this will handle destination directory checks)
      await this.copySourceFiles();

      // Create backup if requested (after files are copied)
      if (this.config.backupOriginal) {
        await this.createBackup();
      }

      // Copy git repository
      await this.copyGitRepository();

      // Analyze git history
      const commits = await this.analyzeGitHistory();

      if (commits.length === 0) {
        this.log("No commits found. Nothing to compress.", "warn");
        return;
      }

      // Calculate new timeline
      const timeline = this.calculateNewTimeline(commits, compressionRatio);

      // Apply date compression
      if (!this.config.dryRun) {
        await this.applyDateCompression(commits, timeline);
      } else {
        this.log("DRY RUN: Would apply the following changes:", "info");
        this.log(
          `Original timeline: ${timeline.originalDuration.toFixed(2)} days`,
          "info"
        );
        this.log(
          `Target timeline: ${timeline.targetDuration.toFixed(2)} days`,
          "info"
        );
      }

      this.stats.endTime = new Date();
      this.printSummary();
    } catch (error) {
      this.log(`Fatal error: ${error.message}`, "error");
      if (this.config.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async createBackup() {
    const backupDir = `${this.config.outputDir}_backup_${Date.now()}`;
    this.log(`Creating backup at: ${backupDir}`, "info");

    if (fs.existsSync(this.config.outputDir)) {
      // Count files for backup progress
      const totalFiles = this.countFiles(this.config.outputDir);
      const progressBar = new SimpleProgressBar(
        "💾 Creating backup snapshot [:bar] :current/:total :percent",
        {
          complete: "█",
          incomplete: "░",
          width: 40,
          total: totalFiles,
        }
      );

      await this.copyDirectory(this.config.outputDir, backupDir, progressBar);
      progressBar.finish();
      this.log("✅ Backup created successfully", "info");
    } else {
      this.log("⚠️  No destination directory to backup (first run)", "warn");
    }
  }

  async copySourceFiles() {
    this.log("📁 Initializing file transfer...", "info");

    if (fs.existsSync(this.config.outputDir) && !this.config.force) {
      throw new Error(
        `Output directory '${this.config.outputDir}' already exists. Use --force or set FORCE=true to overwrite.`
      );
    }

    if (fs.existsSync(this.config.outputDir)) {
      fs.rmSync(this.config.outputDir, { recursive: true, force: true });
    }

    // Count total files for progress bar
    const totalFiles = this.countFiles(this.config.sourceDir);
    const progressBar = new SimpleProgressBar(
      "📁 Copying source files [:bar] :current/:total :percent",
      {
        complete: "█",
        incomplete: "░",
        width: 40,
        total: totalFiles,
      }
    );

    await this.copyDirectory(
      this.config.sourceDir,
      this.config.outputDir,
      progressBar
    );
    progressBar.finish();
    this.log("✅ Source files copied successfully", "info");
  }

  countFiles(dir) {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".git") continue;
        count += this.countFiles(fullPath);
      } else {
        count++;
      }
    }
    return count;
  }

  async copyDirectory(src, dest, progressBar = null) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === ".git") {
          this.log("Skipping .git directory during file copy...", "debug");
          continue;
        }
        await this.copyDirectory(srcPath, destPath, progressBar);
      } else {
        fs.copyFileSync(srcPath, destPath);
        if (progressBar) {
          progressBar.tick();
        }
      }
    }
  }

  async copyGitRepository() {
    this.log("🔧 Initializing git repository transfer...", "info");

    const destGitPath = path.join(this.config.outputDir, ".git");
    const srcGitPath = path.join(this.config.sourceDir, ".git");

    if (!fs.existsSync(srcGitPath)) {
      throw new Error(
        "No .git directory found in source. Cannot compress git history."
      );
    }

    if (fs.existsSync(destGitPath)) {
      fs.rmSync(destGitPath, { recursive: true, force: true });
    }

    // Use progress bar for .git copy
    const totalFiles = this.countFiles(srcGitPath);
    const progressBar = new SimpleProgressBar(
      "🔧 Copying git repository [:bar] :current/:total :percent",
      {
        complete: "█",
        incomplete: "░",
        width: 40,
        total: totalFiles,
      }
    );

    await this.copyDirectory(srcGitPath, destGitPath, progressBar);
    progressBar.finish();
    this.log("✅ Git repository copied successfully (Node.js method)", "info");
  }

  async analyzeGitHistory() {
    this.log("📊 Analyzing git history...", "info");

    const originalCwd = process.cwd();
    process.chdir(this.config.outputDir);

    try {
      const output = execSync(
        'git log --reverse --format="%H %at %an %ae %s"',
        { encoding: "utf8" }
      );

      const commits = output
        .trim()
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const [hash, timestamp, author, email, ...messageParts] =
            line.split(" ");
          const message = messageParts.join(" ");
          return {
            hash,
            timestamp: parseInt(timestamp),
            author,
            email,
            message,
            date: new Date(parseInt(timestamp) * 1000),
          };
        });

      this.stats.totalCommits = commits.length;
      this.log(`Found ${commits.length} commits to process`, "info");

      if (commits.length > 0) {
        const firstCommit = commits[0];
        const lastCommit = commits[commits.length - 1];
        this.log(
          `Original timeline: ${firstCommit.date.toISOString()} to ${lastCommit.date.toISOString()}`,
          "info"
        );
      }

      return commits;
    } finally {
      process.chdir(originalCwd);
    }
  }

  calculateNewTimeline(commits, compressionRatio) {
    const originalStart = commits[0].timestamp;
    const originalEnd = commits[commits.length - 1].timestamp;
    const originalDuration = originalEnd - originalStart;
    const targetDuration = originalDuration * compressionRatio;

    const startTimestamp = new Date(this.config.startDate).getTime() / 1000;
    const endTimestamp = startTimestamp + targetDuration;

    return {
      originalStart,
      originalEnd,
      originalDuration,
      targetDuration,
      startTimestamp,
      endTimestamp,
      compressionRatio,
    };
  }

  async applyDateCompression(commits, timeline) {
    this.log("⏰ Initializing timeline compression...", "info");

    const originalCwd = process.cwd();
    process.chdir(this.config.outputDir);

    // Clean the working directory before rewriting history
    try {
      execSync("git reset --hard && git clean -fd", { stdio: "pipe" });
    } catch (cleanError) {
      this.log(
        `Warning: Could not clean working directory: ${cleanError.message}`,
        "warn"
      );
    }

    // Create progress bar for commit processing
    const progressBar = new SimpleProgressBar(
      "⏰ Adjusting commit dates [:bar] :current/:total :percent",
      {
        complete: "█",
        incomplete: "░",
        width: 40,
        total: commits.length,
      }
    );

    try {
      for (let i = 0; i < commits.length; i++) {
        const commit = commits[i];
        const originalOffset = commit.timestamp - timeline.originalStart;
        const newOffset =
          (originalOffset / timeline.originalDuration) *
          timeline.targetDuration;
        const newTimestamp = Math.floor(timeline.startTimestamp + newOffset);
        const newDate = new Date(newTimestamp * 1000).toISOString();

        this.log(
          `Processing commit ${i + 1}/${
            commits.length
          }: ${commit.hash.substring(0, 8)} -> ${newDate}`,
          "debug"
        );

        try {
          let envFilterCmd;
          if (process.platform === "win32") {
            envFilterCmd = `git filter-branch -f --env-filter \"if [ $GIT_COMMIT = ${commit.hash} ]; then export GIT_AUTHOR_DATE=${newDate}; export GIT_COMMITTER_DATE=${newDate}; fi\"`;
          } else {
            envFilterCmd = `git filter-branch -f --env-filter 'if [ $GIT_COMMIT = \"${commit.hash}\" ]; then export GIT_AUTHOR_DATE=\"${newDate}\"; export GIT_COMMITTER_DATE=\"${newDate}\"; fi'`;
          }
          execSync(envFilterCmd, { stdio: "pipe" });

          this.stats.processedCommits++;
        } catch (error) {
          this.log(
            `Warning: Could not adjust commit ${commit.hash.substring(0, 8)}: ${
              error.message
            }`,
            "warn"
          );
          this.stats.errors++;
        }

        progressBar.tick();
      }

      progressBar.finish();
      this.log("✅ Date compression completed", "info");
    } finally {
      process.chdir(originalCwd);
    }
  }

  printSummary() {
    const duration = this.stats.endTime - this.stats.startTime;

    console.log("\n" + "=".repeat(60));
    console.log("🎉 GIT TIMELINE COMPRESSION ENGINE - COMPLETED");
    console.log("=".repeat(60));
    console.log(`📊 Statistics:`);
    console.log(`   • Total commits: ${this.stats.totalCommits}`);
    console.log(`   • Processed commits: ${this.stats.processedCommits}`);
    console.log(`   • Errors: ${this.stats.errors}`);
    console.log(`   • Duration: ${(duration / 1000).toFixed(2)} seconds`);
    console.log(`\n📁 Output location: ${path.resolve(this.config.outputDir)}`);
    console.log(`🔧 Configuration:`);
    console.log(`   • Source: ${this.config.sourceDir}`);
    console.log(
      `   • Compression ratio: ${this.config
        .calculateCompressionRatio()
        .toFixed(3)}`
    );
    console.log(`   • Start date: ${this.config.startDate}`);
    console.log("=".repeat(60));
  }
}

// CLI argument parsing
function parseArguments() {
  const args = process.argv.slice(2);
  const config = new GitCompressorConfig();

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--source":
        config.sourceDir = args[++i];
        break;
      case "--output":
        config.outputDir = args[++i];
        break;
      case "--start-date":
        config.startDate = args[++i];
        break;
      case "--end-date":
        config.endDate = args[++i];
        break;
      case "--compression-ratio":
        config.compressionRatio = parseFloat(args[++i]);
        break;
      case "--original-days":
        config.originalDays = parseFloat(args[++i]);
        break;
      case "--target-days":
        config.targetDays = parseFloat(args[++i]);
        break;
      case "--backup":
        config.backupOriginal = true;
        break;
      case "--verbose":
        config.verbose = true;
        break;
      case "--dry-run":
        config.dryRun = true;
        break;
      case "--force":
        config.force = true;
        break;
      case "--help":
        printHelp();
        process.exit(0);
      case "--version":
        console.log("Git Timeline Compression Engine v2.0.0");
        process.exit(0);
      default:
        console.error(`Unknown option: ${args[i]}`);
        printHelp();
        process.exit(1);
    }
  }

  return config;
}

function printHelp() {
  console.log(`
Git Timeline Compression Engine v2.0.0
=====================================

A professional tool for compressing git commit timelines by dynamically adjusting commit dates.

USAGE:
  node compress.js [options]

OPTIONS:
  --source <path>              Source directory (default: ./source)
  --output <path>              Output directory (default: ./destination)
  --start-date <date>          Start date in ISO format (default: 2025-06-18T09:00:00)
  --end-date <date>            End date in ISO format (optional)
  --compression-ratio <ratio>  Compression ratio between 0 and 1
  --original-days <days>       Original timeline in days
  --target-days <days>         Target timeline in days
  --backup                     Create backup before processing
  --verbose                    Enable verbose logging
  --dry-run                    Show what would be done without making changes
  --force                      Overwrite existing output directory
  --help                       Show this help message
  --version                    Show version information

ENVIRONMENT VARIABLES:
  SOURCE_DIR                   Source directory
  OUTPUT_DIR                   Output directory
  START_DATE                   Start date in ISO format
  END_DATE                     End date in ISO format
  COMPRESSION_RATIO            Compression ratio between 0 and 1
  ORIGINAL_DAYS               Original timeline in days
  TARGET_DAYS                 Target timeline in days
  BACKUP_ORIGINAL             Create backup (true/false)
  VERBOSE                     Enable verbose logging (true/false)
  DRY_RUN                     Dry run mode (true/false)
  FORCE                       Force overwrite (true/false)

EXAMPLES:
  # Basic usage with command line arguments
  node compress.js --source ./source --output ./destination --original-days 25 --target-days 17.5

  # Using environment variables
  SOURCE_DIR=./source OUTPUT_DIR=./destination ORIGINAL_DAYS=25 TARGET_DAYS=17.5 node compress.js

  # With custom start date and compression ratio
  node compress.js --source ./source --output ./destination --compression-ratio 0.7 --start-date "2025-06-18T09:00:00"

  # Dry run to see what would happen
  node compress.js --source ./source --output ./destination --original-days 25 --target-days 17.5 --dry-run --verbose

CONFIGURATION:
  Create a .env file in your project root to set default values:
  
  SOURCE_DIR=./source
  OUTPUT_DIR=./destination
  START_DATE=2025-06-18T09:00:00
  COMPRESSION_RATIO=0.7
  ORIGINAL_DAYS=25
  TARGET_DAYS=17.5
  BACKUP_ORIGINAL=true
  VERBOSE=true
  FORCE=false
`);
}

// Main execution
async function main() {
  try {
    const config = parseArguments();
    const compressor = new GitHistoryCompressor(config);
    await compressor.run();
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { GitHistoryCompressor, GitCompressorConfig };
