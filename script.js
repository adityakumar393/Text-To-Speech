let speech = new SpeechSynthesisUtterance();
let voices = [];
let voiceSelect = document.querySelector("select");

window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
    speech.voice = voices[0];
    voices.forEach((voice, i) => (voiceSelect.options[i] = new Option(voice.name, i)));
};

voiceSelect.addEventListener("change", () => {
    speech.voice = voices[voiceSelect.value];
});

const audioPlayback = document.getElementById("audioPlayback");
const textInput = document.getElementById("textInput");

document.querySelector("button").addEventListener("click", async () => {
    const text = textInput.innerText.trim();
    if (!text) return;

    const words = text.split(/\s+/);
    textInput.innerHTML = words.map(word => `<span>${word}</span>`).join(" ");
    const spans = textInput.querySelectorAll("span");

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = speech.voice;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onboundary = function(event) {
        if (event.name === "word" || event.charIndex !== undefined) {
            spans.forEach(span => span.classList.remove("highlight"));
            let charCount = 0;
            for (let i = 0; i < spans.length; i++) {
                charCount += spans[i].innerText.length + 1;
                if (charCount > event.charIndex) {
                    spans[i].classList.add("highlight");
                    break;
                }
            }
        }
    };

    const downloadEnabled = document.getElementById("downloadToggle").checked;

    if (downloadEnabled) {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            const mediaRecorder = new MediaRecorder(displayStream);
            let audioChunks = [];

            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'video/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                audioPlayback.src = audioUrl;

                const a = document.createElement('a');
                a.href = audioUrl;
                a.download = 'screen_audio.webm';
                a.click();
            };

            mediaRecorder.start();
            window.speechSynthesis.speak(utterance);

            utterance.onend = () => {
                setTimeout(() => {
                    mediaRecorder.stop();
                    displayStream.getTracks().forEach(track => track.stop());
                }, 500);
            };
        } catch (err) {
            alert("Screen recording failed or permission was denied.");
            console.error(err);
            window.speechSynthesis.speak(utterance); // fallback
        }
    } else {
        window.speechSynthesis.speak(utterance);
    }
});
