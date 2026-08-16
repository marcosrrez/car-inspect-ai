import io
import math
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFilter
from typing import Dict, Any, List

def generate_sample_audio_wav(condition_name: str) -> bytes:
    """
    Synthesize realistic acoustic waveforms for test scenarios:
    - Healthy Idle: 4-cylinder 750 RPM combustion cycle (25 Hz fundamental + harmonics + white noise floor)
    - Rod Knock: 25 Hz repetition with sharp high-impact percussive transients (120 Hz damped sine burst)
    - Belt Squeal: 2.2 kHz continuous screech with frequency modulation
    - Vacuum Leak: High-pass filtered 3.5 kHz air rush / white noise
    - Lifter Tick: 12.5 Hz half-speed sharp click transients (1.8 kHz burst)
    """
    sr = 16000
    duration = 3.0
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    
    if condition_name == "Rod Knock":
        # Heavy double-tap at 25 Hz
        signal_out = np.zeros_like(t)
        period_samples = int(sr / 25)
        for i in range(0, len(t) - 400, period_samples):
            burst = np.exp(-np.linspace(0, 10, 300)) * np.sin(2 * np.pi * 140 * np.linspace(0, 300/sr, 300))
            signal_out[i:i+300] += burst * 2.5
            if i + 120 + 200 < len(t):
                burst2 = np.exp(-np.linspace(0, 12, 200)) * np.sin(2 * np.pi * 160 * np.linspace(0, 200/sr, 200))
                signal_out[i+120:i+120+200] += burst2 * 1.2
        signal_out += 0.15 * np.sin(2 * np.pi * 25 * t) + 0.03 * np.random.normal(0, 0.05, len(t))

    elif condition_name == "Serpentine Belt Squeal":
        mod = 1.0 + 0.1 * np.sin(2 * np.pi * 8 * t)
        signal_out = 0.7 * np.sin(2 * np.pi * 2200 * mod * t) + 0.3 * np.sin(2 * np.pi * 4400 * t) + 0.1 * np.random.normal(0, 0.05, len(t))

    elif condition_name == "Vacuum Leak / Intake Hiss":
        noise = np.random.normal(0, 0.3, len(t))
        signal_out = np.convolve(noise, [0.8, -0.8], mode='same') * 2.0 + 0.05 * np.sin(2 * np.pi * 25 * t)

    elif condition_name == "Lifter / Tappet Tick":
        signal_out = 0.25 * np.sin(2 * np.pi * 25 * t) + 0.05 * np.random.normal(0, 0.04, len(t))
        period_samples = int(sr / 12.5)
        for i in range(0, len(t) - 150, period_samples):
            click = np.exp(-np.linspace(0, 15, 120)) * np.sin(2 * np.pi * 1850 * np.linspace(0, 120/sr, 120))
            signal_out[i:i+120] += click * 1.5

    else:
        combustion = (
            0.4 * np.sin(2 * np.pi * 25 * t) +
            0.3 * np.sin(2 * np.pi * 50 * t) +
            0.15 * np.sin(2 * np.pi * 75 * t) +
            0.08 * np.sin(2 * np.pi * 100 * t)
        )
        air_flow = 0.08 * np.random.normal(0, 0.05, len(t))
        signal_out = combustion + air_flow

    max_val = np.max(np.abs(signal_out))
    if max_val > 0:
        signal_out = (signal_out / max_val * 0.9).astype(np.float32)

    bio = io.BytesIO()
    sf.write(bio, signal_out, sr, format='WAV')
    return bio.getvalue()

def generate_sample_image_png(component_key: str, scenario: str) -> bytes:
    """Generate realistic synthetic inspection test images."""
    w, h = 640, 480
    img = Image.new("RGB", (w, h), color=(40, 42, 48))
    draw = ImageDraw.Draw(img)
    
    if scenario == "milkshake":
        # Creamy caramel milkshake background
        draw.rectangle([0, 0, w, h], fill=(210, 175, 120))
        # Dipstick blade tip
        draw.rectangle([280, 20, 360, 460], fill=(235, 205, 150))
        # Frothy bubbles
        for bx, by, br in [(220, 140, 24), (320, 200, 35), (420, 180, 28), (260, 320, 40), (380, 360, 30), (300, 410, 25)]:
            draw.ellipse([bx-br, by-br, bx+br, by+br], fill=(245, 225, 185), outline=(190, 155, 100), width=3)

    elif scenario == "bone_dry":
        draw.rectangle([0, 0, w, h], fill=(135, 140, 145))
        draw.line([0, 240, w, 240], fill=(100, 105, 110), width=6)
        for bx in [100, 240, 380, 520]:
            draw.ellipse([bx-30, 240-30, bx+30, 240+30], fill=(160, 165, 170), outline=(90, 95, 100), width=4)
            draw.ellipse([bx-15, 240-15, bx+15, 240+15], fill=(120, 125, 130))

    elif scenario == "wet_grime":
        draw.rectangle([0, 0, w, h], fill=(25, 28, 32))
        draw.ellipse([100, 100, 540, 420], fill=(10, 10, 12))
        draw.arc([180, 180, 460, 360], start=30, end=150, fill=(60, 65, 75), width=4)

    elif scenario == "corroded_battery":
        draw.rectangle([0, 0, w, h], fill=(30, 32, 35))
        draw.ellipse([180, 120, 460, 360], fill=(100, 195, 185))
        draw.ellipse([220, 160, 420, 320], fill=(215, 250, 245))

    elif scenario == "blurry_error":
        draw.rectangle([0, 0, w, h], fill=(15, 15, 15))
        img = img.filter(ImageFilter.GaussianBlur(radius=25))

    else:
        draw.rectangle([0, 0, w, h], fill=(140, 145, 150))
        draw.ellipse([200, 120, 440, 360], fill=(165, 170, 175), outline=(100, 105, 110), width=4)

    bio = io.BytesIO()
    img.save(bio, format="PNG")
    return bio.getvalue()

SAMPLE_PRESETS = {
    "audio": [
        {"id": "healthy_idle", "title": "Healthy Engine Idle (750 RPM)", "condition": "Healthy Engine Idle", "context": "idling", "expected_points": 3, "is_walk": False},
        {"id": "rod_knock", "title": "Connecting Rod Knock (Catastrophic)", "condition": "Rod Knock", "context": "idling", "expected_points": -10, "is_walk": True},
        {"id": "lifter_tick", "title": "Valvetrain Hydraulic Lifter Tick", "condition": "Lifter / Tappet Tick", "context": "idling", "expected_points": -2, "is_walk": False},
        {"id": "vacuum_leak", "title": "Intake Manifold Vacuum Leak / Hiss", "condition": "Vacuum Leak / Intake Hiss", "context": "idling", "expected_points": -3, "is_walk": False},
        {"id": "belt_squeal", "title": "Serpentine Accessory Belt Squeal", "condition": "Serpentine Belt Squeal", "context": "idling", "expected_points": -2, "is_walk": False}
    ],
    "vision": [
        {"id": "timing_cover_dry", "component_key": "s2_timing_cover", "title": "Bone Dry Timing Cover", "condition": "Bone dry", "scenario": "bone_dry", "expected_points": 3, "is_walk": False},
        {"id": "timing_cover_wet", "component_key": "s2_timing_cover", "title": "Wet Grimy Timing Cover", "condition": "Wet, grimy", "scenario": "wet_grime", "expected_points": -5, "is_walk": False},
        {"id": "dipstick_milkshake", "component_key": "s1_dipstick", "title": "Milkshake Oil (Blown Head Gasket)", "condition": "Milkshake, foamy", "scenario": "milkshake", "expected_points": -10, "is_walk": True},
        {"id": "oil_pan_wet", "component_key": "s3_oil_pan_leaks", "title": "Active Dripping Oil Pan", "condition": "Active dripping / wet casing", "scenario": "wet_grime", "expected_points": -5, "is_walk": False},
        {"id": "battery_corroded", "component_key": "s1_battery", "title": "Heavy Battery Acid Corrosion", "condition": "Heavy corroded crust / aged 5+ yrs", "scenario": "corroded_battery", "expected_points": -3, "is_walk": False},
        {"id": "blurry_test", "component_key": "s2_timing_cover", "title": "Blurry Dark Photo ('I Can't See That' Error)", "condition": "Error", "scenario": "blurry_error", "expected_points": 0, "is_walk": False}
    ]
}
