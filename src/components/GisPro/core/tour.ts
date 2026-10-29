import gsap from "gsap";
import type { CameraShot, TourChapterScript, TourScript } from "../data/types";
import type { CameraRig } from "./cameraRig";

interface TourCallbacks {
  onTour: (patch: {
    playing?: boolean;
    chapter?: number;
    canResume?: boolean;
  }) => void;
  onCue: (cue: string | undefined, shot: CameraShot, chapter?: TourChapterScript) => void;
  onChapterStart: (chapter: TourChapterScript, index: number) => void;
  onComplete: () => void;
}

export interface TourController {
  play(): void;
  pause(): void;
  resume(): void;
  next(): void;
  goTo(index: number): void;
  stop(): void;
  isPlaying(): boolean;
  getChapter(): number;
  getProgress(): number;
  resetProgress(): void;
  destroy(): void;
}

export function createTourController(
  rig: CameraRig,
  script: TourScript,
  callbacks: TourCallbacks,
): TourController {
  let timeline: gsap.core.Timeline | null = null;
  let playing = false;
  let chapterIndex = 0;
  let progress = 0;

  const killTimeline = (): void => {
    if (timeline) {
      timeline.kill();
      timeline = null;
    }
    playing = false;
  };

  /** 进度按章节均分，在当前章节内连续填充，和底部 5 个节点对齐。 */
  const syncProgress = (): void => {
    if (!timeline) return;
    const total = timeline.duration();
    if (total <= 0) return;
    const fraction = Math.max(0, Math.min(1, timeline.time() / total));
    progress =
      ((chapterIndex + fraction) / Math.max(1, script.chapters.length)) * 100;
  };

  const buildShotTimeline = (
    shots: CameraShot[],
    chapter: TourChapterScript | undefined,
    onDone: () => void,
  ): gsap.core.Timeline => {
    const tl = gsap.timeline({
      paused: true,
      onComplete: onDone,
    });
    shots.forEach((shot) => {
      tl.to(rig.state, {
        x: shot.state.x,
        z: shot.state.z,
        height: shot.state.height,
        heading: shot.state.heading,
        pitch: shot.state.pitch,
        range: shot.state.range,
        duration: shot.duration,
        ease: "power2.inOut",
        onStart: () => callbacks.onCue(shot.cue, shot, chapter),
      });
      if (shot.hold && shot.hold > 0) {
        tl.to({}, { duration: shot.hold });
      }
    });
    return tl;
  };

  const playChapter = (index: number): void => {
    if (!script.chapters.length) return;
    const safeIndex = Math.max(0, Math.min(script.chapters.length - 1, index));
    chapterIndex = safeIndex;
    const chapter = script.chapters[safeIndex];
    killTimeline();
    progress = (safeIndex / Math.max(1, script.chapters.length)) * 100;
    callbacks.onChapterStart(chapter, safeIndex);
    callbacks.onTour({ playing: true, chapter: safeIndex, canResume: false });
    playing = true;

    timeline = buildShotTimeline(chapter.shots, chapter, () => {
      if (!playing) return;
      if (chapterIndex < script.chapters.length - 1) {
        playChapter(chapterIndex + 1);
      } else {
        playing = false;
        timeline = null;
        progress = 100;
        callbacks.onTour({ playing: false, chapter: chapterIndex, canResume: true });
        callbacks.onComplete();
      }
    });
    timeline.play(0);
  };

  const play = (): void => {
    if (timeline && playing) return;
    if (timeline && !playing) {
      timeline.resume();
      playing = true;
      callbacks.onTour({ playing: true, canResume: false });
      return;
    }
    playChapter(chapterIndex);
  };

  const pause = (): void => {
    if (!timeline || !playing) return;
    timeline.pause();
    playing = false;
    callbacks.onTour({ playing: false, canResume: true });
  };

  const resume = (): void => {
    if (timeline && !playing) {
      timeline.resume();
      playing = true;
      callbacks.onTour({ playing: true, canResume: false });
      return;
    }
    playChapter(chapterIndex);
  };

  const next = (): void => {
    const nextIndex = Math.min(script.chapters.length - 1, chapterIndex + 1);
    playChapter(nextIndex);
  };

  const stop = (): void => {
    if (!timeline) return;
    // 停止后再次播放会从本章开头重来，进度也对齐到本章起点。
    progress = (chapterIndex / Math.max(1, script.chapters.length)) * 100;
    killTimeline();
    callbacks.onTour({ playing: false, chapter: chapterIndex, canResume: true });
  };

  return {
    play,
    pause,
    resume,
    next,
    goTo: (index: number) => {
      playChapter(index);
    },
    stop,
    isPlaying: () => playing,
    getChapter: () => chapterIndex,
    getProgress: () => {
      syncProgress();
      return progress;
    },
    resetProgress: () => {
      progress = 0;
    },
    destroy: () => {
      killTimeline();
    },
  };
}
