import type { Leafer } from "leafer-ui";
import type { CameraController } from "./camera";
import { SHEET } from "./theme";
import type { SceneHandles } from "./types";

export interface ExportResult {
  filename: string;
  width: number;
  height: number;
}

export async function exportSheetPng(
  leafer: Leafer,
  scene: SceneHandles,
  camera: CameraController
): Promise<ExportResult> {
  const previousCamera = camera.getState();
  const overlayVisible = scene.selection.visible;
  const source = leafer.canvas.view as unknown as HTMLCanvasElement;

  scene.selection.visible = false;
  camera.fit(40);

  try {
    await waitFrames(2);
    const state = camera.getState();
    const ratioX = source.width / source.clientWidth;
    const ratioY = source.height / source.clientHeight;

    const left = clamp(Math.round(state.x * ratioX), 0, source.width);
    const top = clamp(Math.round(state.y * ratioY), 0, source.height);
    const width = clamp(
      Math.round(SHEET.width * state.scale * ratioX),
      1,
      source.width - left
    );
    const height = clamp(
      Math.round(SHEET.height * state.scale * ratioY),
      1,
      source.height - top
    );

    const output = document.createElement("canvas");
    output.width = width;
    output.height = height;
    const context = output.getContext("2d");
    if (!context) throw new Error("当前浏览器无法创建导出画布");
    context.drawImage(source, left, top, width, height, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      output.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("当前浏览器无法导出画布"));
      }, "image/png");
    });

    const filename = `leafer-field-07-${timestamp()}.png`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);

    return { filename, width, height };
  } finally {
    scene.selection.visible = overlayVisible;
    camera.setState(previousCamera);
  }
}

function waitFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count;
    const step = (): void => {
      remaining -= 1;
      if (remaining <= 0) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function timestamp(): string {
  const now = new Date();
  const pad = (value: number): string => `${value}`.padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}
