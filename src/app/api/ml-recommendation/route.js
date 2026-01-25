import { NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['nitrogen', 'phosphorous', 'potassium', 'ph', 'moisture', 'temperature', 'crop'];
    const missingFields = requiredFields.filter(field => !body[field] && body[field] !== 0);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Prepare input data for Python script
    const inputData = {
      nitrogen: parseFloat(body.nitrogen) || 0,
      phosphorous: parseFloat(body.phosphorous) || 0,
      potassium: parseFloat(body.potassium) || 0,
      ph: parseFloat(body.ph) || 7.0,
      moisture: parseFloat(body.moisture) || 0,
      soil_ec: parseFloat(body.soil_ec) || 0,
      temperature: parseFloat(body.temperature) || 25,
      crop: body.crop || 'Wheat'
    };

    // Get the path to the Python script
    const projectRoot = path.join(__dirname, '../../../../');
    const pythonScriptPath = path.join(projectRoot, 'models', 'predict_fertilizer.py');

    // Prepare input JSON
    const inputJson = JSON.stringify(inputData);

    // Try to find Python executable (Windows-friendly)
    let pythonCmd = null;
    const pythonCommands = process.platform === 'win32'
      ? ['python', 'py', 'python3', 'py -3']  // Windows: prioritize 'python' (likely 3.10 with libs)
      : ['python3', 'python'];  // Unix-like: try python3 first

    for (const cmd of pythonCommands) {
      try {
        const { stdout } = await execAsync(`"${cmd}" --version`, {
          timeout: 5000,
          shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'
        });
        // Check if version is 3.7+
        const versionMatch = stdout.match(/Python (\d+)\.(\d+)/);
        if (versionMatch) {
          const major = parseInt(versionMatch[1]);
          const minor = parseInt(versionMatch[2]);
          if (major === 3 && minor >= 7) {
            pythonCmd = cmd;
            console.log(`✓ Found Python: ${cmd} (${stdout.trim()})`);
            break;
          }
        }
      } catch (err) {
        // Try next command
        continue;
      }
    }

    if (!pythonCmd) {
      return NextResponse.json(
        {
          success: false,
          error: 'Python not found. Please install Python 3.7+ and ensure it is in your PATH. On Windows, you can use the Python launcher (py) or add Python to PATH.',
          details: 'Tried commands: ' + pythonCommands.join(', ')
        },
        { status: 500 }
      );
    }

    // Execute Python script using spawn for better stdin control
    const scriptPath = path.resolve(pythonScriptPath);

    console.log(`Executing Python script: ${scriptPath}`);
    console.log(`Input data:`, inputData);

    // Use spawn for better control over stdin (avoids Windows echo/pipe issues)
    return new Promise((resolve, reject) => {
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
        console.error('Python process error:', error);
        resolve(NextResponse.json(
          {
            success: false,
            error: 'Failed to start Python process',
            details: error.message
          },
          { status: 500 }
        ));
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script exited with code:', code);
          console.error('Stderr:', stderr);
          console.error('Stdout:', stdout);
          resolve(NextResponse.json(
            {
              success: false,
              error: 'Python script execution failed',
              details: stderr || stdout || `Exit code: ${code}`
            },
            { status: 500 }
          ));
          return;
        }

        // Parse Python output
        let result;
        try {
          result = JSON.parse(stdout.trim());
        } catch (parseError) {
          console.error('Failed to parse Python output:', stdout);
          console.error('Python errors:', stderr);
          resolve(NextResponse.json(
            {
              success: false,
              error: 'Failed to parse model prediction',
              details: stderr || stdout
            },
            { status: 500 }
          ));
          return;
        }

        if (result.success) {
          resolve(NextResponse.json({
            success: true,
            predictions: result.predictions,
            input: inputData
          }));
        } else {
          resolve(NextResponse.json(
            {
              success: false,
              error: result.error || 'Model prediction failed',
              details: stderr
            },
            { status: 500 }
          ));
        }
      });

      // Write input JSON to stdin
      pythonProcess.stdin.write(inputJson);
      pythonProcess.stdin.end();
    });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}
