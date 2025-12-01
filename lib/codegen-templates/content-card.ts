export default `export async function contentCardStep(input: {
  cardType?: string;
  cardPrompt?: string;
  imageSourceType?: string;
  imageUrl?: string;
  imageBase64?: string;
}) {
  "use step";

  const rawCardType = (input.cardType as string) || "text";
  const cardType =
    rawCardType && rawCardType.toLowerCase() === "image" ? "image" : "text";
  const prompt = (input.cardPrompt as string) || "";

  if (cardType === "image") {
    const rawSourceType = (input.imageSourceType as string) || "url";
    const sourceType =
      rawSourceType &&
      ["base64", "upload", "node"].includes(rawSourceType.toLowerCase())
        ? "base64"
        : "url";
    const image =
      sourceType === "base64"
        ? ((input.imageBase64 as string) || "")
        : ((input.imageUrl as string) || "");

    return {
      success: true,
      type: "image" as const,
      prompt,
      image,
      url: sourceType === "url" ? image : undefined,
      base64: sourceType === "base64" ? image : undefined,
    };
  }

  return { success: true, type: "text" as const, prompt, text: prompt };
}
`;
