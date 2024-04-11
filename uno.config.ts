// uno.config.js
import { defineConfig, presetMini } from "unocss";

export default defineConfig({
  // ...UnoCSS options
  presets: [
    presetMini({
      dark: "media",
    }),
  ],
});
