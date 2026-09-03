import "./main.ts";

const isTextView = new URLSearchParams(location.search).get("view") === "text";

if (!isTextView) {
  void import("./editor.ts");
}
