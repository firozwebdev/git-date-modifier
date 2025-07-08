# Git History Compressor v2.0.0

A professional, robust tool for compressing git commit history by dynamically adjusting commit dates with environment variable support.

## 🚀 Features

- **Environment Variable Configuration** - All settings via `.env` file
- **Dynamic Date Calculation** - Automatic compression ratio calculation
- **Multiple Compression Methods** - Direct ratio or day-based calculation
- **Professional Logging** - Structured logging with timestamps and levels
- **Backup Support** - Automatic backup creation before processing
- **Dry Run Mode** - Preview changes without applying them
- **Cross-Platform** - Works on Windows, macOS, and Linux
- **Error Handling** - Comprehensive error handling and validation
- **Statistics** - Detailed processing statistics and summary

## 📦 Installation

```bash
npm install dotenv
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# Source and output directories
SOURCE_DIR=./source
OUTPUT_DIR=./destination

# Date configuration
START_DATE=2025-06-18T09:00:00
END_DATE=2025-07-13T09:00:00

# Compression options (choose one method)
COMPRESSION_RATIO=0.7
# ORIGINAL_DAYS=25
# TARGET_DAYS=17.5

# Behavior options
BACKUP_ORIGINAL=true
VERBOSE=true
DRY_RUN=false
FORCE=false
```

### Command Line Options

```bash
node compress.js [options]

Options:
  --source <path>              Source directory
  --output <path>              Output directory
  --start-date <date>          Start date in ISO format
  --end-date <date>            End date in ISO format
  --compression-ratio <ratio>  Compression ratio (0.0 to 1.0)
  --original-days <days>       Original timeline in days
  --target-days <days>         Target timeline in days
  --backup                     Create backup before processing
  --verbose                    Enable verbose logging
  --dry-run                    Show what would be done
  --force                      Overwrite existing output
  --help                       Show help
  --version                    Show version
```

## 🎯 Usage Examples

### Basic Usage with Environment Variables

```bash
# Copy env.example to .env and modify
cp env.example .env

# Run with environment configuration
node compress.js
```

### Command Line Usage

```bash
# Basic compression
node compress.js --source ./source --output ./destination --original-days 25 --target-days 17.5

# With custom start date and compression ratio
node compress.js --source ./source --output ./destination --compression-ratio 0.7 --start-date "2025-06-18T09:00:00"

# Dry run to preview changes
node compress.js --source ./source --output ./destination --original-days 25 --target-days 17.5 --dry-run --verbose

# Force overwrite existing directory
node compress.js --source ./source --output ./destination --original-days 25 --target-days 17.5 --force
```

### Advanced Usage

```bash
# Create backup and use verbose logging
BACKUP_ORIGINAL=true VERBOSE=true node compress.js

# Dry run with custom configuration
DRY_RUN=true COMPRESSION_RATIO=0.5 START_DATE="2025-01-01T00:00:00" node compress.js
```

## 🔧 Compression Methods

### Method 1: Direct Compression Ratio

Set `COMPRESSION_RATIO` to a value between 0.0 and 1.0:

```env
COMPRESSION_RATIO=0.7  # Compress to 70% of original timeline
```

### Method 2: Day-Based Calculation

Set both `ORIGINAL_DAYS` and `TARGET_DAYS`:

```env
ORIGINAL_DAYS=25
TARGET_DAYS=17.5
```

The tool will automatically calculate the compression ratio: `17.5 / 25 = 0.7`

## 📊 Output

The tool provides detailed output including:

- Configuration summary
- Processing progress
- Statistics (total commits, processed, errors)
- Timeline information
- Completion summary

Example output:

```
🚀 Starting Git History Compression Tool
📁 Copying source files...
✅ Source files copied successfully
🔧 Copying git repository...
✅ Git repository copied successfully
📊 Analyzing git history...
Found 150 commits to process
Original timeline: 2025-01-01T00:00:00.000Z to 2025-01-25T23:59:59.000Z
⏰ Applying date compression...
✅ Date compression completed

============================================================
🎉 GIT HISTORY COMPRESSION COMPLETED
============================================================
📊 Statistics:
   • Total commits: 150
   • Processed commits: 150
   • Errors: 0
   • Duration: 12.34 seconds

📁 Output location: /path/to/destination
🔧 Configuration:
   • Source: ./source
   • Compression ratio: 0.700
   • Start date: 2025-06-18T09:00:00
============================================================
```

## 🛡️ Safety Features

- **Backup Creation** - Automatic backup before processing
- **Validation** - Comprehensive input validation
- **Dry Run Mode** - Preview changes without applying
- **Error Handling** - Graceful error handling and reporting
- **Force Protection** - Prevents accidental overwrites

## 🔍 Troubleshooting

### Common Issues

1. **"Output directory already exists"**

   - Use `--force` flag or set `FORCE=true`

2. **"No .git directory found"**

   - Ensure source directory contains a git repository

3. **"Unable to calculate compression ratio"**

   - Provide either `COMPRESSION_RATIO` or both `ORIGINAL_DAYS` and `TARGET_DAYS`

4. **Permission errors**
   - Ensure you have write permissions to output directory

### Debug Mode

Enable verbose logging for detailed information:

```bash
VERBOSE=true node compress.js
```

## 📝 License

This tool is part of the git-date-rewriter project.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!
