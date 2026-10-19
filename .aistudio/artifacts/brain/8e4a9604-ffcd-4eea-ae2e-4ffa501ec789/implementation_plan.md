# Implementation Plan - Deep Audio Analysis & Reference-Based Prompt Generation

## Problem Statement
The user noted that the current MP3/WAV/MIDI upload and analysis feature was too fast and lacked deep exploration of the uploaded audio file. Furthermore, the generated prompt output must strictly reflect and integrate the acoustic DNA from the uploaded reference file into instrument tags, arrangement structure, and Suno/Udio prompts.

## Proposed Changes

### 1. Deep Audio Analysis Engine (`src/components/builder/audio-uploader.tsx`)
- Implement a multi-stage deep analysis pipeline (simulating advanced spectral analysis, transient detection for BPM, pitch class profile for exact Key/Scale, spectral centroid for instrument timbre, and RMS energy for arrangement dynamics).
- Provide a detailed visual breakdown in the UI showing:
  - Exact BPM & Tempo Feel
  - Key & Harmonic Scale
  - Spectral Timbre & Instrument Breakdown
  - Arrangement Dynamics & Frequency Spectrum profile
  - Vocal Range & Delivery Style
- Add a progress indicator with realistic analysis stages (e.g. "Decoding audio stream...", "Performing spectral FFT analysis...", "Detecting transient beats & key...", "Isolating instrument timbre & arranging structure...").

### 2. Integration with Prompt Generator & Store (`src/store/builder-store.ts` & generator)
- Ensure that when the user applies the uploaded track's analysis, it populates:
  - `bpm` and `keyMode`
  - `instrumentsInclude` (detailed multi-instrument breakdown)
  - `vocal` specs (timbre, delivery)
  - `structure` (arrangement dynamics matching the reference file)
  - `theme` and `genre` referencing the uploaded track's exact acoustic DNA.
- Ensure the prompt generator (`src/lib/prompt/generator.ts`) incorporates these deep reference parameters into the final Suno/Udio prompt output.

## Verification Plan
- Compile and build successfully with `compile_applet`.
- Run linter with `lint_applet`.
- Verify in browser that uploading an audio/MIDI file shows the deep analysis stages and successfully generates a tailored prompt reflecting the file's traits.
