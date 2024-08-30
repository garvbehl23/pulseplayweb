const path = require('path');

// Get the path of the current directory
console.log('Current directory:', process.cwd());

// Get the path of the directory where the script is located
console.log('Script directory:', __dirname);

// Join paths
const projectPath = path.join(__dirname, 'myProject');
console.log('Project path:', projectPath);