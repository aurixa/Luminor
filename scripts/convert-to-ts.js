/**
 * Luminor
 * Helper script to convert JavaScript files to TypeScript
 * Code written by a mixture of AI (2025)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory to start recursive search
const sourceDir = path.resolve(__dirname, '../src');

// Check if a directory or file should be ignored
const ignorePaths = ['node_modules', 'dist', '.git'];
const shouldIgnore = (filePath) => {
  return ignorePaths.some(ignore => filePath.includes(ignore));
};

// Find all JavaScript files
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (shouldIgnore(filePath)) {
      return;
    }
    
    if (fs.statSync(filePath).isDirectory()) {
      fileList = findJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Convert a JS file to TS
function convertJsToTs(filePath) {
  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Create the new file path
    const tsFilePath = filePath.replace('.js', '.ts');
    
    // Write the content to the new file
    fs.writeFileSync(tsFilePath, content, 'utf8');
    
    console.log(`✅ Converted: ${filePath} -> ${tsFilePath}`);
    
    // Optionally, remove the original file
    // fs.unlinkSync(filePath);
    // console.log(`🗑️ Deleted original: ${filePath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error);
    return false;
  }
}

// List all JavaScript files without converting them
function listJsFiles() {
  const jsFiles = findJsFiles(sourceDir);
  console.log(`\nFound ${jsFiles.length} JavaScript files:`);
  
  // Group files by directory for better readability
  const filesByDir = {};
  jsFiles.forEach(file => {
    const relPath = path.relative(path.resolve(__dirname, '..'), file);
    const dir = path.dirname(relPath);
    if (!filesByDir[dir]) {
      filesByDir[dir] = [];
    }
    filesByDir[dir].push(path.basename(file));
  });
  
  // Print files grouped by directory
  Object.keys(filesByDir).sort().forEach(dir => {
    console.log(`\n📂 ${dir}:`);
    filesByDir[dir].sort().forEach(file => {
      console.log(`  - ${file}`);
    });
  });
  
  console.log('\nTo convert all files, run: npm run convert-to-ts');
  console.log('To convert a specific file, run: npm run convert-to-ts [path-to-file]');
}

// Check for --list flag
if (process.argv.includes('--list')) {
  listJsFiles();
} 
// Convert specific files if multiple paths are provided
else if (process.argv.length > 2 && !process.argv[2].startsWith('--')) {
  // Get all file paths from arguments (skip the first two which are node and script path)
  const filePaths = process.argv.slice(2);
  
  console.log(`Converting ${filePaths.length} file(s)...`);
  
  let converted = 0;
  filePaths.forEach(filePath => {
    const resolvedPath = path.resolve(filePath);
    
    if (fs.existsSync(resolvedPath) && resolvedPath.endsWith('.js')) {
      if (convertJsToTs(resolvedPath)) {
        converted++;
      }
    } else {
      console.error(`File not found or not a JavaScript file: ${resolvedPath}`);
    }
  });
  
  console.log(`\nConverted ${converted} of ${filePaths.length} files.`);
  console.log('Please review the TypeScript files and add type definitions as needed.');
} else {
  // Convert all files in the src directory
  console.log('Finding all JavaScript files...');
  const jsFiles = findJsFiles(sourceDir);
  
  console.log(`Found ${jsFiles.length} JavaScript files.`);
  
  let converted = 0;
  jsFiles.forEach(file => {
    if (convertJsToTs(file)) {
      converted++;
    }
  });
  
  console.log(`Converted ${converted} of ${jsFiles.length} files to TypeScript.`);
  console.log('Please review the TypeScript files and add type definitions as needed.');
  console.log('To delete the original JS files after verification, uncomment the lines in the convertJsToTs function.');
} 