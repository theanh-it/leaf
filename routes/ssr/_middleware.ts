import fs from "fs";
import path from "path";

export default (ctx: any) => {
  // Lấy đường dẫn tuyệt đối từ thư mục gốc dự án
  const root = process.cwd();
  const manifestPath = path.join(root, "dist/fe/.vite/manifest.json");

  let vite = {
    main: "",
    css: "",
  };

  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as any;
    const entry = manifest["index.html"];

    if (entry) {
      const main = entry.file;
      const css = entry.css
        ? Array.isArray(entry.css)
          ? entry.css[0]
          : entry.css
        : "";

      vite = {
        main: `/${main}`,
        css: css ? `/${css}` : "",
      };
    }
  }

  Object.assign(ctx, {
    vite,
  });
};
