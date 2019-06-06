interface FileEntry {
  webpack: boolean;
  ignore?: string[];
  config?: string;

  entry?: string | string[];
  name?: string | string[];
  gzip: boolean;
  full: string[];
}

export interface InputFileEntry extends FileEntry {
  running?: boolean;
  limit?: string;
}

export interface OutputFileEntry extends FileEntry {
  limit: [string, number];
  size: number;
  loading: number;
  running?: number;
}

export interface ReporterResult {
  output: string;
  file: OutputFileEntry;
  failed: boolean;
}

export interface Reporter {
  warn?(msg: string): void;

  error(msg: string): void;

  results(results: ReporterResult[], hint: string): void;
}

type AnalyzerMode = 'server' | 'static' | false;

interface BaseSizeLimitOptions {
  /**
   * Pack files by webpack (default: true)
   */
  webpack?: boolean;

  /**
   * Calculate running time (default: true)
   */
  running?: boolean;

  /**
   * Compress files by gzip  (default: true)
   */
  gzip?: boolean;

  /**
   * A path to custom webpack config.
   */
  config?: string;

  /**
   * Dependencies to be ignored.
   */
  ignore?: string[];

  /**
   * Webpack entry whose size will be checked.
   */
  entry?: string[] | string;
}

export interface SizeLimitNodeOptions extends BaseSizeLimitOptions {
  /**
   * Show package content in browser (default: false)
   */
  analyzer?: AnalyzerMode;

  /**
   * Bundle name for Analyzer mode.
   */
  bundle?: string;

  /**
   *  A path for output bundle.
   */
  output?: string;
}

export interface SizeLimitConfigOptions extends BaseSizeLimitOptions {
  /**
   * Relative paths to files
   */
  path: string[] | string;

  /**
   * The name of this section. It will be useful only if you have
   * multiple sections
   */
  name?: string;

  /**
   * limit: size or time limit for files from path option. It should be a
   * string with a number and unit. Format: 100 B, 10 KB, 500 ms, 1 s.
   */
  limit?: string;
}

export interface SizeStats {
  parsed: number;
  running?: number;
  loading?: number;
  gzip?: number;
}
