/**
 * Python Setup Diagnostic Script
 * Run this to check if Python is properly configured
 * 
 * Usage: node check_python_setup.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function checkPython() {
  console.log('='.repeat(60));
  console.log('Python Setup Diagnostic');
  console.log('='.repeat(60));
  console.log('');

  const pythonCommands = process.platform === 'win32' 
    ? ['py', 'python', 'python3', 'py -3']
    : ['python3', 'python'];

  let foundPython = false;

  for (const cmd of pythonCommands) {
    try {
      console.log(`Checking: ${cmd}...`);
      const { stdout, stderr } = await execAsync(`"${cmd}" --version`, {
        timeout: 5000,
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'
      });
      
      const versionMatch = stdout.match(/Python (\d+)\.(\d+)/);
      if (versionMatch) {
        const major = parseInt(versionMatch[1]);
        const minor = parseInt(versionMatch[2]);
        
        console.log(`  ✓ Found: ${stdout.trim()}`);
        
        if (major === 3 && minor >= 7) {
          console.log(`  ✓ Version is compatible (3.7+)`);
          foundPython = true;
          
          // Check required packages
          console.log(`\nChecking required packages...`);
          try {
            const { stdout: pipList } = await execAsync(`"${cmd}" -m pip list`, {
              timeout: 10000,
              shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'
            });
            
            const requiredPackages = ['pandas', 'numpy', 'scikit-learn', 'joblib'];
            const installedPackages = pipList.toLowerCase();
            
            console.log('\nRequired packages:');
            for (const pkg of requiredPackages) {
              if (installedPackages.includes(pkg.toLowerCase())) {
                console.log(`  ✓ ${pkg} installed`);
              } else {
                console.log(`  ✗ ${pkg} NOT installed`);
                console.log(`    Install with: ${cmd} -m pip install ${pkg}`);
              }
            }
          } catch (err) {
            console.log(`  ⚠ Could not check packages: ${err.message}`);
          }
          
          break;
        } else {
          console.log(`  ✗ Version too old (need 3.7+, found ${major}.${minor})`);
        }
      }
    } catch (err) {
      console.log(`  ✗ Not found or error: ${err.message.split('\n')[0]}`);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  
  if (foundPython) {
    console.log('✅ Python is properly configured!');
    console.log('Your ML model integration should work.');
  } else {
    console.log('❌ Python not found or not compatible');
    console.log('');
    console.log('SOLUTION:');
    console.log('1. Install Python 3.7+ from https://www.python.org/downloads/');
    console.log('2. During installation, check "Add Python to PATH"');
    console.log('3. Restart your terminal/IDE');
    console.log('4. Run this script again to verify');
    console.log('');
    console.log('See PYTHON_SETUP_GUIDE.md for detailed instructions.');
  }
  
  console.log('='.repeat(60));
}

checkPython().catch(console.error);

