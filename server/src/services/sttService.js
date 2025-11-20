import { AssemblyAI } from "assemblyai";
import dotenv from "dotenv";

dotenv.config();

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_API_KEY,
});

const transcribe = async (audio) => {
  const params = {
    audio: audio,
    speech_model: "universal",
  };

  const transcript = await client.transcripts.transcribe(params);

  return transcript;
};

export { transcribe };
