/**
 * Code generation template for Generate Image action
 */
export const generateImageCodegenTemplate = `import { experimental_generateImage as generateImage } from 'ai';

export async function generateImageStep(input: {
  model: string;
  prompt: string;
  imageReference?: string;
}) {
  "use step";
  
  const providerOptions: Record<string, Record<string, unknown>> = {
    openai: {
      apiKey: process.env.AI_GATEWAY_API_KEY,
      ...(input.imageReference ? { image: input.imageReference } : {}),
    },
  };
  const finalPrompt = input.imageReference
    ? \`\${input.prompt}\\nReference image provided.\`
    : input.prompt;

  const result = await generateImage({
    model: input.model as any,
    prompt: finalPrompt,
    size: '1024x1024',
    providerOptions,
  });
  
  return { base64: result.image.toString() };
}`;
