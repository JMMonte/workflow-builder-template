import "server-only";

type ContentCardInput = {
  actionType?: string;
  cardType?: string;
  cardPrompt?: string;
  imageSourceType?: string;
  imageUrl?: string;
  imageBase64?: string;
};

export async function contentCardStep(input: ContentCardInput) {
  "use step";

  // No async work today, but mark awaited for workflow runtime requirements
  await Promise.resolve();

  const normalizedCardType =
    typeof input.cardType === "string" ? input.cardType.toLowerCase() : "";
  const cardType = normalizedCardType === "image" ? "image" : "text";
  const prompt = (input.cardPrompt as string) || "";

  if (cardType !== "image") {
    return {
      success: true,
      type: "text" as const,
      prompt,
      text: prompt,
    };
  }

  const normalizedSourceType =
    typeof input.imageSourceType === "string"
      ? input.imageSourceType.toLowerCase()
      : "";
  const sourceType =
    normalizedSourceType === "base64" ||
    normalizedSourceType === "upload" ||
    normalizedSourceType === "node"
      ? "base64"
      : "url";
  const image =
    sourceType === "base64"
      ? (input.imageBase64 as string) || ""
      : (input.imageUrl as string) || "";

  return {
    success: true,
    type: "image" as const,
    prompt,
    image,
    url: sourceType === "url" ? image : undefined,
    base64: sourceType === "base64" ? image : undefined,
  };
}
