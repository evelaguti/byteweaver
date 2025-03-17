export interface ByteWeaverOptions {
  recursive?: boolean;
  exclude?: string[];
  include?: string[];
  minify?: boolean;
  outputTemplate?: string | null;
}

export interface ConcatenateResult {
  success: boolean;
  fileCount: number;
  outputFile: string;
}

export interface CliOptions extends ByteWeaverOptions {
  directoryPath: string;
  outputFile: string;
}