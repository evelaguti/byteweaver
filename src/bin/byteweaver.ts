#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { concatenateFiles } from '../index';
import { CliOptions, ByteWeaverOptions } from '../types';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

const DEFAULT_CONFIG: ByteWeaverOptions = {
  recursive: false,
  exclude: [],
  include: [],
  minify: false,
  outputTemplate: null,
};

function parseArguments(): CliOptions {
  const args = process.argv.slice(2);
  const options = { 
    ...DEFAULT_CONFIG,
    directoryPath: '',
    outputFile: ''
  } as CliOptions;
  
  let i = 0;
  
  while (i < args.length) {
    const arg = args[i];
    
    switch (arg) {
      case '-r':
      case '--recursive':
        options.recursive = true;
        i++;
        break;
        
      case '-e':
      case '--exclude':
        if (i + 1 < args.length) {
          options.exclude = [...(options.exclude || []), ...args[i + 1].split(',')];
          i += 2;
        } else {
          console.error('Error: --exclude requires a pattern');
          process.exit(1);
        }
        break;
        
      case '-i':
      case '--include':
        if (i + 1 < args.length) {
          options.include = [...(options.include || []), ...args[i + 1].split(',')];
          i += 2;
        } else {
          console.error('Error: --include requires a pattern');
          process.exit(1);
        }
        break;
        
      case '-m':
      case '--minify':
        options.minify = true;
        i++;
        break;
        
      case '-t':
      case '--template':
        if (i + 1 < args.length) {
          options.outputTemplate = args[i + 1];
          i += 2;
        } else {
          console.error('Error: --template requires a template file');
          process.exit(1);
        }
        break;
        
      case '-v':
      case '--version':
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const packageJson = require('../../package.json');
          console.log(`ByteWeaver v${packageJson.version}`);
          process.exit(0);
        } catch (err) {
          console.error('Error: Could not read package.json');
          process.exit(1);
        }
        break;
        
      case '-h':
      case '--help':
        showUsage();
        process.exit(0);
        break;
        
      default:
        if (!options.directoryPath) {
          options.directoryPath = arg;
        } else if (!options.outputFile) {
          options.outputFile = arg;
        }
        i++;
        break;
    }
  }
  
  if (!options.directoryPath || !options.outputFile) {
    showUsage();
    process.exit(1);
  }
  
  return options;
}

function showUsage(): void {
  console.log('Usage: byte-weaver [options] <directory-path> <output-file>');
  console.log('Options:');
  console.log(' -r, --recursive Search recursively through subdirectories');
  console.log(' -e, --exclude <pattern> Files to exclude (comma separated, can use *.ext for extensions)');
  console.log(' -i, --include <pattern> Files to include (comma separated, can use *.ext for extensions)');
  console.log(' -m, --minify Minify the output content');
  console.log(' -t, --template <file> Use a template file for the output');
  console.log(' -v, --version Show version information');
  console.log(' -h, --help Show this help message');
  console.log('Examples:');
  console.log(' byteweaver src output.js');
  console.log(' byteweaver -r src output.js');
  console.log(' byteweaver -e "node_modules,*.json" src output.js');
  console.log(' byteweaver -r -i "*.js,*.ts" -e "test,*.md" src output.js');
  console.log(' byteweaver -m -r -i "*.js" src output.min.js');
}

async function main(): Promise<void> {
  const options = parseArguments();
  
  try {
    const result = await concatenateFiles(options.directoryPath, options.outputFile, options);
    console.log(`✅ Successfully concatenated ${result.fileCount} files to ${options.outputFile}`);
  } catch (error) {
    console.error('❌ Error concatenating files:', (error as Error).message);
    process.exit(1);
  }
}

main();