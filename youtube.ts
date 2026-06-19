export const extractYouTubeId = (urlOrId: string): string | null => {
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;
  if (!trimmed.includes("http")) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "");
    }
    const v = url.searchParams.get("v");
    if (v) return v;
  } catch {
    return null;
  }
  return null;
};
