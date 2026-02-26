<template>
  <div class="voice-input-container">
    <!-- 操作按钮 -->
    <button class="btn" @click="startRecord" :disabled="isRecording">
      开始录音
    </button>
    <button class="btn" @click="stopRecord" :disabled="!isRecording">
      停止录音
    </button>
    <!-- 新增：试听按钮（录音完成后显示） -->
    <button
      class="btn"
      @click="playAudio"
      :disabled="!audioBlobUrl"
      style="background: #67c23a"
    >
      试听录音
    </button>

    <!-- 新增：下载按钮 -->
    <button
      class="btn"
      @click="downloadAudio"
      :disabled="!audioBlobUrl"
      style="background: #e6a23c"
    >
      下载WAV文件
    </button>

    <!-- 状态提示 -->
    <div class="status">{{ statusText }}</div>

    <!-- 音频信息 -->
    <div class="audio-info" v-if="audioInfo.duration">
      <p>音频信息：</p>
      <ul>
        <li>时长：{{ audioInfo.duration.toFixed(2) }} 秒</li>
        <li>格式：{{ audioInfo.format }}</li>
        <li>大小：{{ formatFileSize(audioInfo.size) }}</li>
      </ul>
    </div>

    <!-- 识别结果 -->
    <div class="result-box">
      <p>识别结果：</p>
      <div class="result-content">{{ recognizeResult }}</div>
    </div>

    <!-- 音频播放控件 -->
    <audio ref="audioPlayer" style="display: none"></audio>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from "vue";
import axios from "axios";
import RecordRTC from "recordrtc";

// 响应式状态
const isRecording = ref(false);
const statusText = ref("准备录音");
const recognizeResult = ref("");
const audioBlobUrl = ref("");
const audioPlayer = ref(null);

// 音频信息
const audioInfo = ref({
  duration: 0,
  format: "",
  size: 0,
});

// 核心变量
let recorder = null;
let stream = null;
let audioBlob = null;

// 1. 开始录音方法
const startRecord = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      statusText.value = "当前浏览器不支持录音功能";
      return;
    }

    // 清空之前的试听音频URL
    if (audioBlobUrl.value) {
      URL.revokeObjectURL(audioBlobUrl.value);
      audioBlobUrl.value = "";
      audioInfo.value = { duration: 0, format: "", size: 0 };
    }

    // 获取麦克风权限
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1, // 单声道
        sampleRate: 16000, // 16kHz采样率，适合语音识别
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // 配置RecordRTC
    const options = {
      type: "audio",
      mimeType: "audio/wav",
      recorderType: RecordRTC.StereoAudioRecorder,
      desiredSampRate: 16000, // 期望采样率
      numberOfAudioChannels: 1, // 单声道
      timeSlice: 1000, // 每隔1秒触发一次ondataavailable

      // 当录音数据可用时
      ondataavailable: (blob) => {
        // 可以在这里实现实时上传或处理
        console.log("实时音频数据可用:", blob.size, "bytes");
      },

      // 录音开始回调
      onRecordingStart: () => {
        console.log("录音开始");
      },

      // 错误处理
      onError: (error) => {
        console.error("RecordRTC错误:", error);
        statusText.value = `录音错误: ${error.message}`;
        isRecording.value = false;
      },
    };

    // 创建录音器
    recorder = RecordRTC(stream, options);

    // 开始录音
    recorder.startRecording();
    isRecording.value = true;
    statusText.value = "正在录音...（请说话）";
  } catch (err) {
    statusText.value = `录音失败：${err.message}`;
    isRecording.value = false;
    console.error("录音异常：", err);
  }
};

// 2. 停止录音方法
const stopRecord = () => {
  if (!recorder) {
    statusText.value = "录音器未初始化";
    return;
  }

  isRecording.value = false;
  statusText.value = "正在停止录音...";

  recorder.stopRecording(async () => {
    try {
      // 获取WAV格式的Blob
      audioBlob = recorder.getBlob();

      // 获取音频信息
      const audioElement = new Audio();
      audioElement.src = URL.createObjectURL(audioBlob);

      // 等待音频加载完成以获取时长
      await new Promise((resolve) => {
        audioElement.onloadedmetadata = () => {
          audioInfo.value = {
            duration: audioElement.duration,
            format: audioBlob.type,
            size: audioBlob.size,
          };
          resolve();
        };

        // 如果加载失败，设置默认值
        audioElement.onerror = () => {
          audioInfo.value = {
            duration: 0,
            format: audioBlob.type,
            size: audioBlob.size,
          };
          resolve();
        };
      });

      // 创建用于试听的URL
      audioBlobUrl.value = URL.createObjectURL(audioBlob);
      audioPlayer.value.src = audioBlobUrl.value;

      // 停止流
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      statusText.value = "录音完成，正在识别...";

      // 调用识别接口
      await recognizeAudio(audioBlob);
    } catch (error) {
      statusText.value = `录音处理失败：${error.message}`;
      console.error("录音处理异常：", error);
    }
  });
};

// 3. 试听录音方法
const playAudio = () => {
  if (audioPlayer.value && audioBlobUrl.value) {
    audioPlayer.value.pause();
    audioPlayer.value.currentTime = 0;
    audioPlayer.value.play().catch((err) => {
      statusText.value = `试听失败：${err.message}`;
      console.error("音频播放异常：", err);
    });
    statusText.value = "正在试听录音...";

    // 监听播放结束
    audioPlayer.value.onended = () => {
      statusText.value = "试听结束";
    };
  }
};

// 4. 下载录音文件
const downloadAudio = () => {
  if (!audioBlob) {
    statusText.value = "没有可下载的录音文件";
    return;
  }

  try {
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;

    // 生成文件名：录音_年月日_时分秒.wav
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now
      .getHours()
      .toString()
      .padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
    a.download = `录音_${timestamp}.wav`;

    document.body.appendChild(a);
    a.click();

    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    statusText.value = "文件下载中...";
  } catch (error) {
    statusText.value = `下载失败：${error.message}`;
    console.error("下载异常：", error);
  }
};

// 5. 识别接口方法
const recognizeAudio = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "voice.wav");

    const response = await axios.post(
      "http://10.59.247.114:5678/api/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 1000 * 60,
      }
    );

    recognizeResult.value = response.data.context || "未识别到内容";
    statusText.value = "识别完成（可试听或下载录音）";
  } catch (err) {
    statusText.value = `识别失败：${err.message}`;
    recognizeResult.value = "";
    console.error("识别接口异常：", err);
  }
};

// 6. 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 7. 组件卸载时清理资源
onUnmounted(() => {
  // 停止录音
  if (recorder && recorder.state === "recording") {
    recorder.stopRecording();
  }

  // 停止媒体流
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  // 释放Blob URL
  if (audioBlobUrl.value) {
    URL.revokeObjectURL(audioBlobUrl.value);
  }

  // 销毁录音器
  if (recorder) {
    recorder.destroy();
    recorder = null;
  }
});
</script>

<style scoped>
.voice-input-container {
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.btn {
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  margin-right: 10px;
  margin-bottom: 10px;
  border: none;
  background: #409eff;
  color: white;
  border-radius: 4px;
  transition: all 0.3s;
}

.btn:hover:not(:disabled) {
  opacity: 0.8;
  transform: translateY(-1px);
}

.btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.status {
  margin: 15px 0;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
  border-left: 4px solid #409eff;
  color: #666;
  font-size: 14px;
}

.audio-info {
  margin: 15px 0;
  padding: 15px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.audio-info p {
  margin: 0 0 10px 0;
  color: #333;
  font-weight: bold;
}

.audio-info ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.audio-info li {
  margin: 5px 0;
}

.result-box {
  margin-top: 20px;
  padding: 20px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.result-box p {
  margin: 0 0 10px 0;
  color: #333;
  font-weight: bold;
}

.result-content {
  margin-top: 10px;
  min-height: 80px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
  color: #333;
  font-size: 16px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid #eee;
}
</style>
