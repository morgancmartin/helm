import { exec } from 'child_process';
import path from 'path';
import util from 'util';

const execAsync = util.promisify(exec);

export async function promptGPT2(prompt: string) {
  const scriptRelativePath = '../hooked_prompt.py';
  // const scriptAbsolutePath = path.join(__dirname, scriptRelativePath);

  try {
    // Adjust the path to the virtual environment activate script
    const command = `bash -c "source ../venv/bin/activate && python ${scriptRelativePath} --feature=0 '${prompt}'"`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error(`Python script error: ${stderr}`);
      // return;
    }

    const output = stdout.trim();
    const lines = output.split('\n');
    const result = lines.slice(2, lines.length).join('\n');
    console.log(`Python script output: ${result}`);
    return result
  } catch (error: any) {
    console.error(`Error executing Python script: ${error.message}`);
    return ''
  }
}
