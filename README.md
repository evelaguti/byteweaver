# ByteWeaver 🧵
A powerful command-line utility to weave files together with advanced filtering, minification and templating capabilities.

## 🚀 Installation
Install globally:
```bash
npm install -g byteweaver
```

Or locally in your project:
```bash
npm install --save-dev byteweaver
```

## 💻 Usage
```bash
byteweaver [options] <directory-path> <output-file>
```

Or use the shorter alias:
```bash
bw [options] <directory-path> <output-file>
```

### Options
- `-r, --recursive` - Search recursively through subdirectories
- `-e, --exclude <pattern>` - Files to exclude (comma separated, can use *.ext for extensions)
- `-i, --include <pattern>` - Files to include (comma separated, can use *.ext for extensions)
- `-m, --minify` - Minify the output content (remove comments and excessive whitespace)
- `-t, --template <file>` - Use a template file for the output
- `-d, --debug` - Show detailed debug information during processing
- `--header <text>` - Add header text at the beginning of the output file
- `--footer <text>` - Add footer text at the end of the output file
- `--image-mode <mode>` - Image processing mode: "base64-html", "base64-markdown", or "none"
- `-v, --version` - Show version information
- `-h, --help` - Show help message

### Examples
Basic usage:
```bash
byteweaver src output.js
```

Using the shorter alias:
```bash
bw src output.js
```

Recursively search through directories:
```bash
bw -r src output.js
```

Include only JavaScript files:
```bash
bw -i "*.js" src output.js
```

Exclude specific files or patterns:
```bash
bw -e "node_modules,*.json" src output.js
```

Minify the output:
```bash
bw -m src output.min.js
```

Use a template file:
```bash
bw -t template.txt src output.js
```

Enable debug mode:
```bash
bw -d src output.js
```

Add header and footer text:
```bash
bw --header="/* Copyright 2025 */" --footer="// End of file" src output.js
```

Process images as base64 in HTML:
```bash
bw --image-mode="base64-html" images output.html
```

Combine options:
```bash
bw -r -i "*.js,*.ts" -e "test,*.md,*.json" -m -d src output.min.js
```

**Important note for zsh users:** When using wildcards in exclude patterns, make sure to quote the patterns to prevent shell expansion:
```bash
bw -r -e "*.jpg,*.png,node_modules" src output.txt
```

Combined flags are supported:
```bash
bw -rmi "*.ts" src output.js  # Equivalent to -r -m -i "*.ts"
bw -rmd src output.js         # Equivalent to -r -m -d
```

## 🔧 Programmatic API
ByteWeaver can also be used programmatically in your TypeScript or JavaScript applications:

```typescript
import { concatenateFiles } from 'byteweaver';

concatenateFiles('./src', './output.js', { recursive: true })
  .then(result => console.log(`Processed ${result.fileCount} files`))
  .catch(error => console.error(error));

concatenateFiles('./src', './output.min.js', {
  recursive: true,
  include: ['*.js', '*.ts'],
  exclude: ['test', '*.spec.js', 'node_modules'],
  minify: true,
  outputTemplate: './template.txt',
  debug: true,
  header: '/* Copyright 2025 */',
  footer: '// End of file',
  imageMode: 'base64-html'
})
  .then(result => console.log(`Success: ${result.success}, Files: ${result.fileCount}`))
  .catch(error => console.error(error));
```

## 🔨 Development
This project is built with TypeScript. To contribute:
1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Make your changes in the `src` directory
4. Build the project:
```bash
npm run build
```
5. Test your changes:
```bash
npm run dev -- [options] <directory-path> <output-file>
```

## ✅ Features
- Concatenate files from a specified directory
- Optional recursive directory traversal
- Include only specific file types or patterns
- Exclude files by name, path, or extension pattern
- Minify output to reduce size
- Use templates to customize the output format
- Clean output with proper file separation and comments
- Debug mode for detailed processing information
- Add custom header and footer text to output files
- Process images as base64 in HTML or Markdown format
- Support for combined command-line flags
- Fully typed with TypeScript for better developer experience

## 📄 Template Files
You can use a template file with the placeholder `{{content}}` to customize how the concatenated content is formatted. For example:
```
{{content}}
```

## 📦 License
MIT