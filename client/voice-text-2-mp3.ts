import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import util from 'util';

const client = new textToSpeech.TextToSpeechClient();

const text2mp3 = async (json, outputFile) => {
  const [response] = await client.synthesizeSpeech(json);
  if (!response.audioContent) return;
  const writeFile = util.promisify(fs.writeFile);
  await writeFile(outputFile, response.audioContent, 'binary');
  console.log(`Audio content written to file: ${outputFile}`);
};

const voices = ['hee', 'mietemasu'];

Promise
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  .all(voices.map((v) => text2mp3(require(`./voice/${v}.json`), `./public/pongs/${v}.mp3`)))
  .catch((e) => console.error(e));
