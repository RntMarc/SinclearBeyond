// public/office-worker.js

// This script runs in the ZetaOffice worker thread.
// It is loaded via ZetaHelperMain.

const init = () => {
  console.log("Office worker initializing...");
  const { zetajs, zJsModule } = globalThis.zetajsStore;
  const port = zetajs.mainPort;
  const css = zetajs.uno.com.sun.star;
  const context = zetajs.getUnoComponentContext();
  const desktop = css.frame.Desktop.create(context);

  port.onmessage = (e) => {
    const { cmd, path } = e.data;
    console.log("Worker received command:", cmd, path);

    try {
      if (cmd === "open") {
        const url = "file://" + path;
        desktop.loadComponentFromURL(url, "_default", 0, []);
      } else if (cmd === "save") {
        const url = "file://" + path;
        const model = desktop.getCurrentComponent();
        if (model) {
          // Check for XStorable interface
          // In zetajs, queryInterface can be used
          const storable = model.queryInterface(
            zetajs.type.interface(css.frame.XStorable),
          );
          if (storable) {
            storable.storeToURL(url, []);
            port.postMessage({ cmd: "saved", path });
          } else {
            console.error("Document is not storable");
            port.postMessage({
              cmd: "error",
              error: "Document is not storable",
            });
          }
        } else {
          console.error("No current component to save");
          port.postMessage({
            cmd: "error",
            error: "No current component to save",
          });
        }
      }
    } catch (err) {
      console.error("Error in worker:", err);
      port.postMessage({ cmd: "error", error: err.toString() });
    }
  };

  console.log("Office worker initialized and listening.");
};

// The zetajsStore is populated by zetajs before this script runs
// because ZetaHelperMain ensures it.
if (globalThis.zetajsStore) {
  init();
} else {
  // Fallback or wait? Normally it should be there if loaded via ZetaHelperMain
  console.warn("zetajsStore not found immediately in worker.");
  // We could poll or wait for a specific signal if needed, but zetajs examples suggest it's there.
}
