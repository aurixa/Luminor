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

// Convert a specific file or all files
if (process.argv.length > 2) {
  // Convert a specific file
  const specificFile = path.resolve(process.argv[2]);
  
  if (fs.existsSync(specificFile) && specificFile.endsWith('.js')) {
    convertJsToTs(specificFile);
  } else {
    console.error(`File not found or not a JavaScript file: ${specificFile}`);
  }
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