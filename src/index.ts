import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { ByteWeaverOptions, ConcatenateResult } from './types';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

/**
 * Recursively gets all files from a directory
 */
export async function getFilesRecursively(
  directory: string,
  excludePatterns: string[] = [],
  includePatterns: string[] = [],
  fileList: string[] = []
): Promise<string[]> {
  const files = await readdir(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const relativePath = path.relative(process.cwd(), filePath);
    
    const shouldExclude = excludePatterns.some(pattern => {
      if (pattern.startsWith('*')) {
        return filePath.endsWith(pattern.slice(1));
      }
      return relativePath.includes(pattern);
    });
    
    const shouldInclude = includePatterns.length === 0 || includePatterns.some(pattern => {
      if (pattern.startsWith('*')) {
        return filePath.endsWith(pattern.slice(1));
      }
      return relativePath.includes(pattern);
    });
    
    if (shouldExclude || !shouldInclude) continue;
    
    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      await getFilesRecursively(filePath, excludePatterns, includePatterns, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Minifies content by removing comments and excessive whitespace
 */
export function minifyContent(content: string): string {
  return content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Concatenates files from a directory into a single output file
 */
export async function concatenateFiles(
  directoryPath: string,
  outputFile: string,
  options: ByteWeaverOptions = {}
): Promise<ConcatenateResult> {
  const opts: Required<ByteWeaverOptions> = {
    recursive: options.recursive || false,
    exclude: options.exclude || [],
    include: options.include || [],
    minify: options.minify || false,
    outputTemplate: options.outputTemplate || null
  };
  
  try {
    let filePaths: string[];
    
    if (opts.recursive) {
      filePaths = await getFilesRecursively(directoryPath, opts.exclude, opts.include);
    } else {
      const files = await readdir(directoryPath);
      filePaths = files.map(file => path.join(directoryPath, file));
      
      filePaths = filePaths.filter(filePath => {
        const fileName = path.basename(filePath);
        
        const shouldExclude = opts.exclude.some(pattern => {
          if (pattern.startsWith('*')) {
            return fileName.endsWith(pattern.slice(1));
          }
          return fileName.includes(pattern) || filePath.includes(pattern);
        });
        
        const shouldInclude = opts.include.length === 0 || opts.include.some(pattern => {
          if (pattern.startsWith('*')) {
            return fileName.endsWith(pattern.slice(1));
          }
          return fileName.includes(pattern) || filePath.includes(pattern);
        });
        
        return !shouldExclude && shouldInclude;
      });
    }
    
    const outputFilePath = path.resolve(outputFile);
    
    filePaths = filePaths.filter(filePath => {
      return fs.statSync(filePath).isFile() && path.resolve(filePath) !== outputFilePath;
    });
    
    let concatenatedContent = '';
    
    for (const filePath of filePaths) {
      const content = await readFile(filePath, 'utf8');
      const trimmedContent = opts.minify ? minifyContent(content) : content;
      concatenatedContent += `\n\n${trimmedContent}\n`;
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
      outputFile
    };
  } catch (error) {
    throw new Error(`Error concatenating files: ${(error as Error).message}`);
  }
}