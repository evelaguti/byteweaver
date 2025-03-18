#!/usr/bin/env node
import { concatenateFiles } from '../index';
import { CliOptions, ByteWeaverOptions } from '../types';
import path from 'path';

const DEFAULT_CONFIG: ByteWeaverOptions = {
  recursive: false,
  exclude: [],
  include: [],
  minify: false,
  outputTemplate: null,
  header: '',
  footer: '',
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
    // Manejo de banderas combinadas (por ejemplo, -rmi)
    if (arg.startsWith('-') && !arg.startsWith('--') && arg.length > 2) {
      // Es una combinación de opciones cortas
      const flags = arg.substring(1).split('');
      let requiresValue = false;
      let flagWithValue = '';
      
      for (const flag of flags) {
        switch (flag) {
          case 'r':
            options.recursive = true;
            break;
          case 'm':
            options.minify = true;
            break;
          case 'd':
            options.debug = true;
            break;
          case 'e':
            requiresValue = true;
            flagWithValue = 'e';
            break;
          case 'i':
            requiresValue = true;
            flagWithValue = 'i';
            break;
          case 't':
            requiresValue = true;
            flagWithValue = 't';
            break;
          case 'v':
            try {
              const packageJson = require('../../package.json');
              console.log(`ByteWeaver v${packageJson.version}`);
              process.exit(0);
            } catch (err) {
              console.error('Error: Could not read package.json');
              process.exit(1);
            }
            break;
          case 'h':
            showUsage();
            process.exit(0);
            break;
          default:
            console.error(`Error: Unknown option -${flag}`);
            showUsage();
            process.exit(1);
        }
      }
      
      // Si una de las banderas requiere un valor, lo procesamos
      if (requiresValue) {
        if (i + 1 < args.length) {
          const value = args[i + 1];
          switch (flagWithValue) {
            case 'e':
              options.exclude = [...(options.exclude || []), ...value.split(',')];
              break;
            case 'i':
              options.include = [...(options.include || []), ...value.split(',')];
              break;
            case 't':
              options.outputTemplate = value;
              break;
          }
          i += 2; // Avanzamos el índice para saltar el valor
        } else {
          console.error(`Error: -${flagWithValue} requires a value`);
          process.exit(1);
        }
      } else {
        i++; // Si no requiere valor, solo avanzamos al siguiente argumento
      }
    } else {
      // Procesamiento original para argumentos individuales
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
        case '-d':
        case '--debug':
          options.debug = true;
          i++;
          break;
        case '--header':
          if (i + 1 < args.length) {
            options.header = args[i + 1];
            i += 2;
          } else {
            console.error('Error: --header requires a value');
            process.exit(1);
          }
          break;
        case '--footer':
          if (i + 1 < args.length) {
            options.footer = args[i + 1];
            i += 2;
          } else {
            console.error('Error: --footer requires a value');
            process.exit(1);
          }
          break;
        case '--image-mode':
          if (i + 1 < args.length) {
            const mode = args[i + 1];
            if (['base64-html', 'base64-markdown', 'none'].includes(mode)) {
              options.imageMode = mode as 'base64-html' | 'base64-markdown' | 'none';
            } else {
              console.error('Error: --image-mode debe ser "base64-html", "base64-markdown" o "none"');
              process.exit(1);
            }
            i += 2;
          } else {
            console.error('Error: --image-mode requiere un valor');
            process.exit(1);
          }
          break;
        case '-v':
        case '--version':
          try {
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
  }

  if (!options.directoryPath || !options.outputFile) {
    showUsage();
    process.exit(1);
  }

  return options;
}

function showUsage(): void {
  const options = [
    { flag: '-r, --recursive', desc: 'Search recursively through subdirectories' },
    { flag: '-e, --exclude <pattern>', desc: 'Files to exclude (comma separated, can use *.ext for extensions)' },
    { flag: '-i, --include <pattern>', desc: 'Files to include (comma separated, can use *.ext for extensions)' },
    { flag: '-m, --minify', desc: 'Minify the output content' },
    { flag: '-t, --template <file>', desc: 'Use a template file for the output' },
    { flag: '-d, --debug', desc: 'Show detailed debug information during processing' },
    { flag: '--header <text>', desc: 'Add header text at the beginning of the output file' },
    { flag: '--footer <text>', desc: 'Add footer text at the end of the output file' },
    { flag: '--image-mode <mode>', desc: 'Modo de procesamiento de imágenes: "base64-html", "base64-markdown" o "none"' },
    { flag: '-v, --version', desc: 'Show version information' },
    { flag: '-h, --help', desc: 'Show this help message' }
  ];
  
  const examples = [
    { cmd: 'byteweaver src output.js', desc: '' },
    { cmd: 'byteweaver -r src output.js', desc: '' },
    { cmd: 'byteweaver -e "node_modules,*.json" src output.js', desc: '' },
    { cmd: 'byteweaver -r -i "*.js,*.ts" -e "test,*.md" src output.js', desc: '' },
    { cmd: 'byteweaver -m -r -i "*.js" src output.min.js', desc: '' },
    { cmd: 'byteweaver --header="/* Copyright 2025 */" --footer="/* End of file */" src output.js', desc: '' }
  ];
  
  const combinedFlags = [
    { cmd: 'bw -rmi "*.ts" src output.js', desc: 'Equivalent to -r -m -i "*.ts"' },
    { cmd: 'bw -rmd src output.js', desc: 'Equivalent to -r -m -d' }
  ];
  
  // Imprimir encabezado
  console.log('Usage: byteweaver [options] <directory-path> <output-file>');
  
  // Imprimir opciones
  console.log('Options:');
  options.forEach(opt => {
    console.log(` ${opt.flag.padEnd(25)} ${opt.desc}`);
  });
  
  // Imprimir información sobre banderas combinadas
  console.log('');
  console.log('Combined flags are supported:');
  combinedFlags.forEach(flag => {
    console.log(` ${flag.cmd.padEnd(30)} ${flag.desc}`);
  });
  
  // Imprimir ejemplos
  console.log('');
  console.log('Examples:');
  examples.forEach(ex => {
    console.log(` ${ex.cmd}`);
  });
}

async function main(): Promise<void> {
  const options = parseArguments();
  try {
    const result = await concatenateFiles(options.directoryPath, options.outputFile, options);
    console.log(`✅ Successfully concatenated ${result.fileCount} files to ${options.outputFile}`);
    if (result.processedFiles && result.processedFiles.length > 0) {
      console.log('\nFiles processed:');
      result.processedFiles.forEach(file => {
        const fileName = path.basename(file);
        console.log(`- ${fileName}`);
      });
    }
  } catch (error) {
    console.error('❌ Error concatenating files:', (error as Error).message);
    process.exit(1);
  }
}

main();