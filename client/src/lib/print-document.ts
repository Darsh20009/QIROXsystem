type PrintDocumentOptions = {
  title: string;
};

function waitForImages() {
  const pending = Array.from(document.images)
    .filter(image => !image.complete)
    .map(image => new Promise<void>(resolve => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    }));
  return Promise.all(pending);
}

export async function printDocument({ title }: PrintDocumentOptions) {
  const previousTitle = document.title;
  const hiddenElements = Array.from(document.querySelectorAll<HTMLElement>(".no-print"));

  try {
    document.title = title;
    hiddenElements.forEach(element => { element.style.display = "none"; });
    await Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      waitForImages(),
    ]);
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    window.print();
  } finally {
    window.setTimeout(() => {
      document.title = previousTitle;
      hiddenElements.forEach(element => { element.style.display = ""; });
    }, 500);
  }
}