let audioContext;
let oscList = [];
let mainGainNode = null;
let running = false;
let volumeControl;
let whiteNoise;
let compressor;
let makeup;
let globalParams = {
    globalAccent: 2.0,
    volume: 0.5,
    tempo: 120,
    swing: 0
};
function playNote(instrument_id, accent) {
    if (!running)
        setupAudio();
    document.querySelector('#' + instrument_id + '_led').className = 'led active';
    var played_id = instrument_id;
    var closedState = false;
    if (instrument_id == 'chh') {
        instrument_id = 'ohh';
        closedState = true;
    }
    var instrument = instruments_table[instrument_id];
    if (instruments.indexOf(instrument) > -1) {
        playInstrument(instrument, accent);
    }
    else if (generators.indexOf(instrument) > -1) {
        playGenerator(instrument, accent);
    }
    else if (samplers.indexOf(instrument) > -1) {
        playSampler(instrument, accent, closedState);
    }
    var timeout_length = Math.max(instrument.decay + (instrument.delayConst ? instrument.delayConst * 4 + instrument.decay : 0), (instrument.tone_decay ? instrument.tone_decay : 0));
    if (instrument_id == 'ohh') {
        document.querySelector('#' + (played_id == 'chh' ? 'ohh' : 'chh') + '_led').className = 'led';
        if (played_id == 'chh') {
            timeout_length = instrument.decay_closed;
        }
        else {
            timeout_length = instrument.decay / 4;
        }
    }
    clearTimeout(instrument.muteTimeout);
    instrument.muteTimeout = setTimeout(function () {
        instrument.output.gain.value = 0;
        document.querySelector('#' + played_id + '_led').className = 'led';
    }, timeout_length);
}
function makeDistortionCurve(amount = 20) {
    let n_samples = 256, curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
        let x = i * 2 / n_samples - 1;
        curve[i] = (Math.PI + amount) * x / (Math.PI + amount * Math.abs(x));
    }
    return curve;
}
function setupAudio() {
    if (running)
        return;
    running = true;
    audioContext = new (window.AudioContext); // || window.webkitAudioContext)();
    mainGainNode = audioContext.createGain();
    mainGainNode.connect(audioContext.destination);
    mainGainNode.gain.value = globalParams.volume;
    compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(0, audioContext.currentTime);
    compressor.knee.setValueAtTime(10, audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
    compressor.attack.setValueAtTime(0.005, audioContext.currentTime);
    compressor.release.setValueAtTime(0.050, audioContext.currentTime);
    makeup = audioContext.createGain();
    makeup.gain.value = 1.0;
    compressor.connect(makeup);
    makeup.connect(mainGainNode);
    whiteNoise = audioContext.createWhiteNoise();
    for (let instrument of instruments) {
        instruments_table[instrument.id] = instrument;
        setupInstrument(instrument);
        initSequence(instrument.id);
        // sequencer[instrument.id][Math.floor(Math.random() * 16)] = 1;        
    }
    for (let generator of generators) {
        instruments_table[generator.id] = generator;
        setupGenerator(generator);
        initSequence(generator.id);
        sequencer[generator.id][Math.floor(Math.random() * 16)] = 1;
    }
    for (let sampler of samplers) {
        instruments_table[sampler.id] = sampler;
        initSequence(sampler.id);
        if (sampler.id == 'ohh')
            initSequence('chh');
        // sequencer[sampler.id][Math.floor(Math.random() * 16)] = 1; //randomize (todo delete and add presets)
        setupSampler(sampler);
    }
    document.removeEventListener("keydown", setupAudio);
    document.removeEventListener("mousedown", setupAudio);
}
;
window.onload = setup;
