/**
 * Test script to verify Python script execution using spawn
 * Run: node test_python_script.js
 */

const { spawn } = require('child_process');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const execAsync = promisify(exec);

async function testPythonScript() {
  console.log('='.repeat(60));
  console.log('Testing Python Script Execution (using spawn)');
  console.log('='.repeat(60));
  console.log('');

  const projectRoot = __dirname;
  const pythonScriptPath = path.join(projectRoot, 'models', 'predict_fertilizer.py');
  
  // Test input
  const testInput = {
    nitrogen: 50,
    phosphorous: 30,
    potassium: 40,
    ph: 7.0,
    moisture: 50,
    soil_ec: 1.5,
    temperature: 28,
    crop: 'Wheat'
  };

  const inputJson = JSON.stringify(testInput);
  
  // Find Python
  let pythonCmd = null;
  const pythonCommands = process.platform === 'win32' 
    ? ['py', 'python', 'python3']
    : ['python3', 'python'];

  for (const cmd of pythonCommands) {
    try {
      const { stdout } = await execAsync(`"${cmd}" --version`, {
        timeout: 5000,
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'
      });
      const versionMatch = stdout.match(/Python (\d+)\.(\d+)/);
      if (versionMatch) {
        const major = parseInt(versionMatch[1]);
        const minor = parseInt(versionMatch[2]);
        if (major === 3 && minor >= 7) {
          pythonCmd = cmd;
          console.log(`✓ Using Python: ${cmd} (${stdout.trim()})`);
          break;
        }
      }
    } catch (err) {
      continue;
    }
  }

  if (!pythonCmd) {
    console.log('❌ Python not found!');
    return;
  }

  // Test script execution using spawn
  console.log(`\nTesting script: ${pythonScriptPath}`);
  console.log(`Input: ${JSON.stringify(testInput, null, 2)}`);
  console.log('');

  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(pythonScriptPath);
    
    const pythonProcess = spawn(pythonCmd, [scriptPath], {
      cwd: projectRoot,
      shell: false,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('error', (error) => {
      console.log('❌ Process error:', error.message);
      reject(error);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.log('❌ Script execution failed!');
        console.log('\nError details:');
        console.log('Exit code:', code);
        if (stdout) {
          console.log('\nStdout:');
          console.log(stdout);
        }
        if (stderr) {
          console.log('\nStderr:');
          console.log(stderr);
        }
        reject(new Error(`Process exited with code ${code}`));
        return;
      }

      console.log('✓ Script executed successfully!');
      console.log('\nOutput:');
      console.log(stdout);
      
      if (stderr) {
        console.log('\nStderr (warnings/info):');
        console.log(stderr);
      }

      // Try to parse JSON
      try {
        const result = JSON.parse(stdout.trim());
        console.log('\n✓ JSON parsed successfully!');
        console.log('Result:', JSON.stringify(result, null, 2));
        if (result.success) {
          console.log('\n✅ SUCCESS! Predictions received:');
          Object.entries(result.predictions).forEach(([fertilizer, amount]) => {
            if (amount > 0) {
              console.log(`  ${fertilizer}: ${amount.toFixed(2)} kg/ha`);
            }
          });
        }
        resolve(result);
      } catch (parseError) {
        console.log('\n⚠ Could not parse as JSON');
        console.log('Parse error:', parseError.message);
        reject(parseError);
      }
    });

    // Write input JSON to stdin
    pythonProcess.stdin.write(inputJson);
    pythonProcess.stdin.end();
  });
}

testPythonScript()
  .then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
  })
  .catch((error) => {
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(60));
    console.error(error);
    process.exit(1);
  });
