document.addEventListener('DOMContentLoaded', () => {
    const sessionId = Math.random().toString(36).substring(2, 15);
    const textInput = document.getElementById('text-input');
    const sendButton = document.getElementById('send-button');
    const characterImage = document.getElementById('character-image');
    const voiceSelect = document.getElementById('voice-select');
    const status = document.getElementById('status');
    const voiceMuteButton = document.getElementById('voice-mute-button');
    const micOnIcon = voiceMuteButton.querySelector('.mic-on-icon');
    const micOffIcon = voiceMuteButton.querySelector('.mic-off-icon');

    let voiceEnabled = true;

    // Toggle voice state
    voiceMuteButton.addEventListener('click', () => {
        voiceEnabled = !voiceEnabled;
        if (voiceEnabled) {
            voiceMuteButton.classList.add('active');
            micOnIcon.style.display = 'block';
            micOffIcon.style.display = 'none';
        } else {
            voiceMuteButton.classList.remove('active');
            micOnIcon.style.display = 'none';
            micOffIcon.style.display = 'block';
            // Stop speaking immediately if muted during speech
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
            }
            clearInterval(lipSyncInterval);
            characterImage.src = closedMouthImg;
        }
    });

    const openMouthImg = `char-mouth-open.png?v=${sessionId}`;
    const closedMouthImg = `char-mouth-closed.png?v=${sessionId}`;

    // Apply cache-busted source immediately and preload images
    characterImage.src = closedMouthImg;
    const preloadOpen = new Image();
    preloadOpen.src = openMouthImg;
    const preloadClosed = new Image();
    preloadClosed.src = closedMouthImg;

    let voices = [];
    let lipSyncInterval;

    function populateVoiceList() {
        const allVoices = speechSynthesis.getVoices();
        voices = allVoices.filter(voice => voice.name.includes('Google'));
        voiceSelect.innerHTML = '';

        let usVoiceIndex = -1;

        voices.forEach((voice, i) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);

            if (voice.lang === 'en-US') {
                if (usVoiceIndex === -1) { // Find the first US voice
                    usVoiceIndex = i;
                }
            }
        });

        if (usVoiceIndex !== -1) {
            voiceSelect.selectedIndex = usVoiceIndex;
        }
    }

    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    const typewriter = (text, element, speed = 50) => {
        // Use Intl.Segmenter to handle grapheme clusters correctly
        if (window.Intl && Intl.Segmenter) {
            const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
            const segments = Array.from(segmenter.segment(text)).map(s => s.segment);
            
            let i = 0;
            element.innerHTML = "";

            function type() {
                if (i < segments.length) {
                    element.innerHTML += segments[i];
                    i++;
                    setTimeout(type, speed);
                }
            }
            type();
        } else {
            // Fallback for older browsers
            let i = 0;
            element.innerHTML = "";
            function type() {
                if (i < text.length) {
                    element.innerHTML += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                }
            }
            type();
        }
    };

    const speak = (text) => {
        if (!voiceEnabled) {
            return;
        }
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        clearInterval(lipSyncInterval);

        const utterance = new SpeechSynthesisUtterance(text);
        const selectedOption = voiceSelect.selectedOptions[0].getAttribute('data-name');
        const selectedVoice = voices.find(voice => voice.name === selectedOption);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onstart = () => {
            let mouthOpen = true;
            lipSyncInterval = setInterval(() => {
                characterImage.src = mouthOpen ? openMouthImg : closedMouthImg;
                mouthOpen = !mouthOpen;
            }, 150);
        };

        utterance.onend = () => {
            clearInterval(lipSyncInterval);
            characterImage.src = closedMouthImg;
        };

        utterance.onerror = () => {
            clearInterval(lipSyncInterval);
            characterImage.src = closedMouthImg;
        };

        speechSynthesis.speak(utterance);
    };

    const handleSendMessage = async () => {
        const message = textInput.value.trim();
        if (!message) return;

        textInput.value = '';
        textInput.style.height = '50px';
        status.textContent = "Pensando...";

        try {
            // Substitua a URL abaixo pelo link real que o Render gerou para você
            const response = await fetch('https://chatbot-ia-cy3b.onrender.com/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message, session_id: sessionId }),
            });

            if (!response.ok) {
                throw new Error('A conexão com o servidor falhou. Por favor, tente novamente.');
            }

            const data = await response.json();
            typewriter(data.response, status);
            speak(data.response);
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = 'Sinto muito, algo deu errado. Tente novamente mais tarde.';
            typewriter(errorMessage, status);
            speak(errorMessage);
        }
    };

    sendButton.addEventListener('click', handleSendMessage);

    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    textInput.addEventListener('input', () => {
        textInput.style.height = 'auto';
        textInput.style.height = `${textInput.scrollHeight}px`;
    });
});

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});
