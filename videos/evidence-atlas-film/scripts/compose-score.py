"""Build the deterministic 32-second score using the Python standard library."""

import math
from pathlib import Path
import struct
import wave

RATE = 48000
DURATION = 32
DESTINATION = Path(__file__).resolve().parents[1] / "public/audio/atlas-score.wav"


def tone(time, start, frequency, length, gain):
    elapsed = time - start
    if not 0 <= elapsed < length:
        return 0.0
    attack = min(1.0, elapsed / 0.015)
    envelope = attack * math.exp(-elapsed * 4 / length)
    return gain * envelope * (
        math.sin(2 * math.pi * frequency * elapsed)
        + 0.18 * math.sin(4 * math.pi * frequency * elapsed)
    )


def build():
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    notes = [146.832, 220.0, 293.665, 329.628, 261.626, 220.0, 196.0, 293.665]
    cues = [
        (0.2, 587.33), (2.8, 440), (5.3, 659.26), (7.3, 392),
        (10.1, 523.25), (14.8, 587.33), (16.5, 659.26), (19, 440),
        (22.1, 523.25), (24, 659.26), (26.8, 587.33), (28.2, 293.665),
    ]
    frames = bytearray()
    for sample in range(RATE * DURATION):
        time = sample / RATE
        beat = int(time / (2 / 3))
        value = tone(time, beat * (2 / 3), notes[beat % len(notes)], 1.5, 0.085)
        value += tone(time, (beat // 6) * 4, notes[(beat // 6) % len(notes)] / 2, 4, 0.035)
        for start, frequency in cues:
            value += tone(time, start, frequency, 0.36, 0.065)
        fade = min(1, time / 0.35, max(0, (DURATION - time) / 2.4))
        left = value * fade
        right = left * 0.94 + 0.006 * fade * math.sin(2 * math.pi * 220 * time)
        frames.extend(struct.pack("<hh", round(left * 32767), round(right * 32767)))
    with wave.open(str(DESTINATION), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(frames)
    print(f"{DESTINATION.name}: stereo PCM, {DURATION}s, {RATE}Hz")


if __name__ == "__main__":
    build()
