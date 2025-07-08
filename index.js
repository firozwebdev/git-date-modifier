const { execSync, spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const { DateTime } = require('luxon');
const cliProgress = require('cli-progress');

class GitTimeCompressor {
  constructor(options) {
    this.options = {
      source: '.',
      output: './compressed-repo',
      startDate: DateTime.now().toISO(),
      originalDays: 25,
      targetDays: 17.5,
      anonymize: true,
      jitter: true,
      progress: true,
      ...options
    };

    this.isWindows = process.platform === 'win32';
    this.progressBar = this.initProgressBar();
  }

  initProgressBar() {
    return new cliProgress.SingleBar({
      format: `${chalk.blue('{bar}')} {percentage}% | {value}/{total} Commits | ETA: {eta}s`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      clearOnComplete: true
    });
  }

async validateEnvironment() {
  const requiredCommands = ['git', 'git-filter-repo'];
  
  for (const cmd of requiredCommands) {
    try {
      // Try direct execution first (works for git in PATH)
      execSync(`${cmd} --version`, { stdio: 'ignore' });
    } catch {
      // Fallback to platform-specific location checks
      try {
        if (this.isWindows) {
          // Check common install locations on Windows
          const paths = [
            `C:\\Program Files\\Git\\cmd\\${cmd}.exe`,
            `C:\\Program Files (x86)\\Git\\cmd\\${cmd}.exe`,
            path.join(process.env.LOCALAPPDATA, `Programs\\Python\\Python311\\Scripts\\${cmd}.exe`)
          ];
          
          const found = paths.some(p => {
            try {
              fs.accessSync(p);
              return true;
            } catch {
              return false;
            }
          });
          
          if (!found) throw new Error();
        } else {
          // Unix-like systems
          execSync(`command -v ${cmd}`, { stdio: 'ignore' });
        }
      } catch {
        throw new Error(`Required dependency not found: ${cmd}. Please install it and ensure it's in your PATH.`);
      }
    }
  }
}

  async getTotalCommits(repoPath) {
    try {
      const count = execSync('git rev-list --all --count', { cwd: repoPath });
      return parseInt(count.toString().trim(), 10);
    } catch (err) {
      throw new Error(`Failed to count commits: ${err.message}`);
    }
  }

  async createTempRepo() {
    this.tempRepo = path.join(process.cwd(), `.temp-repo-${Date.now()}`);
    
    console.log(chalk.blue(`\n🌀 Creating temporary repository at ${this.tempRepo}`));
    execSync(`git clone --bare "${this.options.source}" "${this.tempRepo}"`, {
      stdio: 'ignore'
    });

    this.totalCommits = await this.getTotalCommits(this.tempRepo);
    if (this.options.progress) {
      this.progressBar.start(this.totalCommits, 0);
    }
  }

  async generateFilterScript() {
    const scriptPath = path.join(this.tempRepo, 'compress_dates.py');
    const startDate = DateTime.fromISO(this.options.startDate);
    
    const scriptContent = `
import datetime
import random
import sys
from datetime import timedelta

START_DATE = datetime.datetime.fromisoformat("${startDate.toISO()}")
COMPRESSION_RATIO = ${this.compressionRatio}
JITTER_ENABLED = ${this.options.jitter}
ANONYMIZE = ${this.options.anonymize}
TOTAL_COMMITS = ${this.totalCommits}

first_original_date = None
commit_count = 0

def commit_callback(commit):
    global first_original_date, commit_count
    
    original_date = datetime.datetime.fromisoformat(commit.author_date.decode())
    
    if first_original_date is None:
        first_original_date = original_date
        new_date = START_DATE
    else:
        original_delta = (original_date - first_original_date).total_seconds()
        compressed_seconds = original_delta * COMPRESSION_RATIO
        new_date = START_DATE + timedelta(seconds=compressed_seconds)
    
    if JITTER_ENABLED:
        new_date += timedelta(minutes=random.randint(-120, 120))
    
    commit.author_date = new_date.isoformat().encode()
    commit.committer_date = new_date.isoformat().encode()
    
    if ANONYMIZE:
        commit.author_name = b"Dev Team"
        commit.author_email = b"dev@company.com"
        commit.committer_name = b"Dev Team"
        commit.committer_email = b"dev@company.com"
    
    commit_count += 1
    if commit_count % 100 == 0:
        sys.stdout.write(f"PROGRESS:{commit_count}\\n")
        sys.stdout.flush()
`;

    await fs.writeFile(scriptPath, scriptContent);
  }

  async executeFilter() {
    console.log(chalk.blue('🔧 Rewriting commit history...'));
    
    const pythonCmd = this.isWindows 
      ? `python "${path.join(this.tempRepo, 'compress_dates.py')}"`
      : `cat "${path.join(this.tempRepo, 'compress_dates.py')}"`;

    return new Promise((resolve, reject) => {
      const filterProcess = spawn(
        'git',
        ['filter-repo', '--force', '--commit-callback', pythonCmd],
        { cwd: this.tempRepo, stdio: ['pipe', 'pipe', 'pipe'] }
      );

      filterProcess.stdout.on('data', (data) => {
        const output = data.toString();
        const progressMatch = output.match(/PROGRESS:(\d+)/);
        if (progressMatch && this.options.progress) {
          this.progressBar.update(parseInt(progressMatch[1]));
        }
      });

      filterProcess.stderr.on('data', (data) => {
        process.stderr.write(chalk.red(data.toString()));
      });

      filterProcess.on('close', (code) => {
        code === 0 ? resolve() : reject(new Error(`Filter failed with code ${code}`));
      });
    });
  }

  async createFinalRepo() {
    if (this.options.progress) {
      this.progressBar.stop();
    }
    
    console.log(chalk.blue(`📦 Creating final repository at ${this.options.output}`));
    
    try {
      await fs.access(this.options.output);
      await fs.rm(this.options.output, { recursive: true, force: true });
    } catch {} // Ignore if directory doesn't exist
    
    execSync(`git clone "${this.tempRepo}" "${this.options.output}"`, {
      stdio: 'ignore'
    });
  }

  async cleanup() {
    console.log(chalk.blue('🧹 Cleaning up temporary files...'));
    await fs.rm(this.tempRepo, { recursive: true, force: true });
  }

  async run() {
    try {
      await this.validateEnvironment();
      await this.createTempRepo();
      await this.generateFilterScript();
      await this.executeFilter();
      await this.createFinalRepo();
      await this.cleanup();
      
      console.log(chalk.green('\n✅ Successfully compressed repository timeline!'));
      console.log(chalk.green(`Output repository: ${path.resolve(this.options.output)}`));
      
      const ratio = (this.options.targetDays / this.options.originalDays).toFixed(2);
      console.log(chalk.blue(`\nTimeline compressed from ${this.options.originalDays} days to ${this.options.targetDays} days (ratio: ${ratio})`));
    } catch (err) {
      this.progressBar.stop();
      console.error(chalk.red(`\n❌ Error: ${err.message}`));
      process.exit(1);
    }
  }

  get compressionRatio() {
    return this.options.targetDays / this.options.originalDays;
  }
}

// CLI Setup
program
  .name('git-time-compressor')
  .description('Compress Git repository timeline while maintaining commit patterns')
  .version('1.0.0')
  .requiredOption('-s, --source <path>', 'Source repository path')
  .option('-o, --output <path>', 'Output directory', './compressed-repo')
  .option('--start-date <date>', 'New timeline start date (ISO format)', DateTime.now().toISO())
  .option('--original-days <days>', 'Original timeline duration in days', parseFloat, 25)
  .option('--target-days <days>', 'Target timeline duration in days', parseFloat, 17.5)
  .option('--no-anonymize', 'Keep original author information')
  .option('--no-jitter', 'Disable timestamp randomization')
  .option('--no-progress', 'Disable progress bar')
  .action(async (options) => {
    const compressor = new GitTimeCompressor(options);
    await compressor.run();
  });

program.parseAsync(process.argv).catch(err => {
  console.error(chalk.red(err.message));
  process.exit(1);
});