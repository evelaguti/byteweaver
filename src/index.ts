import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { ByteWeaverOptions, ConcatenateResult } from './types';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Extensiones de archivos de imagen comunes
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];

function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

function matchesPattern(filePath: string, patterns: string[], isExcludePattern: boolean = false): boolean {
  if (patterns.length === 0 && !isExcludePattern) {
    return true;
  }
  const fileName = path.basename(filePath);
  const relativePath = path.relative(process.cwd(), filePath);
  return patterns.some(pattern => {
    if (pattern.startsWith('*.')) {
      const extension = pattern.slice(1);
      return fileName.endsWith(extension);
    }
    return fileName === pattern || fileName.includes(pattern) || relativePath.includes(pattern) || filePath.includes(pattern);
  });
}

export async function getFilesRecursively(
  directory: string,
  excludePatterns: string[] = [],
  includePatterns: string[] = [],
  fileList: string[] = []
): Promise<string[]> {
  const files = await readdir(directory);
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      await getFilesRecursively(filePath, excludePatterns, includePatterns, fileList);
    } else {
      if (matchesPattern(filePath, excludePatterns, true)) {
        continue;
      }
      if (includePatterns.length > 0 && !matchesPattern(filePath, includePatterns)) {
        continue;
      }
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Función para convertir una imagen a cadena base64
async function imageToBase64(filePath: string): Promise<string> {
  const fileData = await readFile(filePath);
  const base64Data = fileData.toString('base64');
  const mimeType = getMimeType(filePath);
  return `data:${mimeType};base64,${base64Data}`;
}

// Función para determinar el tipo MIME de un archivo
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}
/**
 * Improved minification function
 * Removes comments and excess whitespace
 */
export function minifyContent(content: string): string {
  return content
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/^\s*\n/gm, '') // Remove empty lines
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

// Función para crear el contenido de salida según el formato
function formatOutput(fileName: string, content: string, isImage: boolean): string {
  if (isImage) {
    return `\n\n<!-- Imagen: ${fileName} -->\n<img src="${content}" alt="${fileName}" />\n`;
  } else {
    return `\n\n<!-- Archivo: ${fileName} -->\n${content}\n`;
  }
}

export async function concatenateFiles(
  directoryPath: string,
  outputFile: string,
  options: ByteWeaverOptions = {},
): Promise<ConcatenateResult> {
  const opts: Required<ByteWeaverOptions> = {
    recursive: options.recursive || false,
    exclude: options.exclude || [],
    include: options.include || [],
    minify: options.minify || false,
    outputTemplate: options.outputTemplate || null,
    debug: options.debug || false,
    header: options.header || '',
    footer: options.footer || '',
    imageMode: options.imageMode || 'base64-html',
  };

  try {
    let filePaths: string[];
    const outputFilePath = path.resolve(outputFile);

    if (opts.debug) {
      console.log(`🔍 Searching in: ${directoryPath}`);
      console.log(`🔍 Include patterns: ${opts.include.join(', ') || 'none'}`);
      console.log(`🔍 Exclude patterns: ${opts.exclude.join(', ') || 'none'}`);
      console.log(`🔍 Image mode: ${opts.imageMode}`);
      if (opts.header) console.log(`🔍 Adding header: ${opts.header}`);
      if (opts.footer) console.log(`🔍 Adding footer: ${opts.footer}`);
    }

    if (opts.recursive) {
      filePaths = await getFilesRecursively(directoryPath, opts.exclude, opts.include);
    } else {
      const files = await readdir(directoryPath);
      filePaths = [];
      for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const stats = await stat(filePath);
        if (!stats.isFile()) continue;
        if (
          matchesPattern(filePath, opts.exclude, true) ||
          (opts.include.length > 0 && !matchesPattern(filePath, opts.include))
        ) {
          continue;
        }
        filePaths.push(filePath);
      }
    }

    filePaths = filePaths.filter(filePath => path.resolve(filePath) !== outputFilePath);

    if (opts.debug) {
      console.log(`🔍 Found ${filePaths.length} files:`);
    }

    let concatenatedContent = '';
    if (opts.header) {
      concatenatedContent += `${opts.header}\n\n`;
    }

    for (const filePath of filePaths) {
      if (opts.debug) {
        console.log(` - ${filePath}`);
      }

      const fileName = path.basename(filePath);
      const isImage = isImageFile(filePath);

      try {
        if (isImage) {
          const imageContent = await imageToBase64(filePath);
          concatenatedContent += formatOutput(fileName, imageContent, true);
        } else {
          const content = await readFile(filePath, 'utf8');
          const fileContent = opts.minify ? minifyContent(content) : content;
          concatenatedContent += formatOutput(fileName, fileContent, false);
        }
      } catch (error) {
        console.warn(`Warning: Could not process file ${filePath}: ${(error as Error).message}`);
      }
    }

    if (opts.footer) {
      concatenatedContent += `\n\n${opts.footer}`;
    }

    if(opts.minify){
      concatenatedContent = minifyContent(concatenatedContent) 
    }

    if (opts.outputTemplate) {
      try {
        const templateContent = await readFile(opts.outputTemplate, 'utf8');
        concatenatedContent = templateContent.replace('{{content}}', concatenatedContent);
      } catch (error) {
        throw new Error(`Error reading template file: ${(error as Error).message}`);
      }
    }

    await writeFile(outputFile, concatenatedContent);
    return {
      success: true,
      fileCount: filePaths.length,
      outputFile,
      processedFiles: filePaths,
    };
  } catch (error) {
    throw new Error(`Error concatenating files: ${(error as Error).message}`);
  }
}