// @ts-nocheck

const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');

let mediaRecorder;
let recordedChunks = [];

// 🛠 Request Video Sources
videoSelectBtn.onclick = () => {
  if (window.electronAPI) {
    window.electronAPI.getVideoSources();
  } else {
    console.error("❌ electronAPI is not available. Ensure preload.js is loaded.");
  }
};

// 🛠 Handle Source Selection
if (window.electronAPI) {
  window.electronAPI.onSourceSelected(async (source) => {
    console.log(`Selected source: ${source.name}`);
    videoSelectBtn.innerText = source.name;

    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source.id,
        },
      },
    };

    // 🎥 Capture Stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    videoElement.play();

    // 🛠 Setup Media Recorder
    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = (event) => {
      recordedChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm; codecs=vp9' });
      const arrayBuffer = await blob.arrayBuffer();

      // ✅ Send video to main process for saving
      if (window.electronAPI) {
        window.electronAPI.saveVideo(arrayBuffer);
      } else {
        console.error("❌ electronAPI is not available. Ensure preload.js is loaded.");
      }

      // ✅ Clear recorded chunks
      recordedChunks = [];

      // ✅ Enable "Start Recording" and disable "Stop Recording" after saving
      startBtn.disabled = false;
      stopBtn.disabled = true;
    };
  });
}

// 🎥 Start Recording
startBtn.onclick = () => {
  if (mediaRecorder) {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';

    // ✅ Enable Stop Button
    stopBtn.disabled = false;
    startBtn.disabled = true;
  } else {
    console.error("❌ No mediaRecorder found. Select a video source first.");
  }
};

// 🛑 Stop Recording
stopBtn.onclick = () => {
  if (mediaRecorder) {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start Recording';

    // ✅ Disable Stop Button again
    stopBtn.disabled = true;
    startBtn.disabled = false;
  } else {
    console.error("❌ No mediaRecorder found. Start recording first.");
  }
};
