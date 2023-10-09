function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand("copy");
    const msg = successful ? "successful" : "unsuccessful";
    console.log("Fallback: Copying text command was " + msg);
    document.body.removeChild(textArea);
    return true;
  } catch (err) {
    console.error("Fallback: Oops, unable to copy", err);
    document.body.removeChild(textArea);
    return false;
  }
}

export async function copyTextToClipboard(text: string) {
  if (navigator.clipboard) {
    return await navigator.clipboard.writeText(text).then(
      function () {
        console.log("Async: Copying to clipboard was successful!");
        return true;
      },
      function (err) {
        console.error("Async: Could not copy text: ", err);
        return fallbackCopyTextToClipboard(text);
      }
    );
  }
  return fallbackCopyTextToClipboard(text);
}

export const getObjectPath = (obj: object | undefined, path: string) =>
  path.split(".").reduce((value, p) => value?.[p], obj as any);

export function setObjectPathImmutable<T>(obj: T, path: string, value: any): T {
  const ret: T = { ...obj };
  let intermediate: any = ret;
  path.split(".").forEach((p, idx, arr) => {
    intermediate[p] = arr.length - 1 === idx ? value : { ...intermediate[p] };
    intermediate = intermediate[p];
  });
  return ret;
}
