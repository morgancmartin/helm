import { exec } from 'child_process';
import path from 'path';
import util from 'util';
import { FeatureVector } from './client-state'

const execAsync = util.promisify(exec);

export async function promptGPT2(prompt: string, features?: string) {
  console.log(`GENERATING WITH PROMPT: ${prompt} \n\n\n AND FEATUREs: ${features}`)
  const scriptRelativePath = '../hooked_prompt.py';
  // const scriptAbsolutePath = path.join(__dirname, scriptRelativePath);
  // const featureString = (features ?? []).reduce(
  //   (result, featVec: FeatureVector) => result ? `${result};${featVec[0]},${featVec[1]},${featVec[2]}` : `${featVec[0]},${featVec[1]},${featVec[2]}`,
  //   ''
  // )

  try {
    // Adjust the path to the virtual environment activate script
    const featuresFlag = features ? `--features='${features}' ` : ''
    const command = `bash -c "source ../venv/bin/activate && python ${scriptRelativePath} ${featuresFlag} '${prompt}'"`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error(`Python script error: ${stderr}`);
      // return;
    }

    if (stdout) {
      console.log('STDOUT:', stdout)
    }

    const output = stdout.trim();
    const lines = output.split('\n');
    let result = lines.slice(2, lines.length).join('\n');
    console.log(`Python script output: ${result}`);
    if (features) {
      result = result.slice(prompt.length, result.length - 1)
    }
    return result
  } catch (error: any) {
    console.error(`Error executing Python script: ${error.message}`);
    return ''
  }
}
