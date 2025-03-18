export interface ByteWeaverOptions {
  recursive?: boolean;
  exclude?: string[];
  include?: string[];
  minify?: boolean;
  outputTemplate?: string | null;
  debug?: boolean;
  header?: string;
  footer?: string;
  imageMode?: 'base64-html' | 'base64-markdown' | 'none';
}

export interface ConcatenateResult {
  success: boolean;
  fileCount: number;
  outputFile: string;
  processedFiles?: string[];
}

export interface CliOptions extends ByteWeaverOptions {
  directoryPath: string;
  outputFile: string;
}