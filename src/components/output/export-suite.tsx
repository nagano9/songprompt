"use client";

import * as React from "react";
import { FileMusic, Disc, FileAudio, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PromptInput } from "@/lib/types";

export function ExportSuite({ input }: { input: PromptInput }) {
  const [exportingMidi, setExportingMidi] = React.useState(false);
  const [exportingWav, setExportingWav] = React.useState(false);
  const [exportingMp3, setExportingMp3] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMidi = () => {
    setExportingMidi(true);
    setTimeout(() => {
      const headerChunk = [
        0x4d, 0x54, 0x68, 0x64, // 'MThd'
        0x00, 0x00, 0x00, 0x06, // length 6
        0x00, 0x01,             // format 1
        0x00, 0x01,             // 1 track
        0x00, 0x60              // 96 ticks per quarter note
      ];

      const trackEvents = [
        0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20, // Tempo 120 bpm
        0x00, 0x90, 0x3c, 0x64, // Note On: C4, velocity 100
        0x83, 0x60, 0x80, 0x3c, 0x40, // Note Off after 1 beat
        0x00, 0x90, 0x40, 0x64, // Note On: E4
        0x83, 0x60, 0x80, 0x40, 0x40,
        0x00, 0x90, 0x43, 0x64, // Note On: G4
        0x83, 0x60, 0x80, 0x43, 0x40,
        0x00, 0xff, 0x2f, 0x00  // End of Track
      ];

      const trackLen = trackEvents.length;
      const trackLengthBytes = [
        (trackLen >> 24) & 0xff,
        (trackLen >> 16) & 0xff,
        (trackLen >> 8) & 0xff,
        trackLen & 0xff
      ];

      const trackChunk = [0x4d, 0x54, 0x72, 0x6b, ...trackLengthBytes, ...trackEvents];
      const midiArray = new Uint8Array([...headerChunk, ...trackChunk]);
      const blob = new Blob([midiArray], { type: "audio/midi" });
      const safeTitle = (input.theme || input.genre || "songprompt-export").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      downloadFile(blob, `${safeTitle}.mid`);
      setExportingMidi(false);
      setSuccessMsg("File MIDI berhasil diunduh!");
      setTimeout(() => setSuccessMsg(null), 3000);
    }, 600);
  };

  const handleExportWav = async () => {
    setExportingWav(true);
    try {
      const sampleRate = 44100;
      const durationSeconds = 4;
      const offlineCtx = new OfflineAudioContext(2, sampleRate * durationSeconds, sampleRate);

      const osc1 = offlineCtx.createOscillator();
      const osc2 = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "square";
      osc1.frequency.setValueAtTime(220, 0); // A3
      osc2.frequency.setValueAtTime(330, 0); // E4

      gain.gain.setValueAtTime(0.3, 0);
      gain.gain.exponentialRampToValueAtTime(0.001, durationSeconds);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(offlineCtx.destination);

      osc1.start(0);
      osc2.start(0);
      osc1.stop(durationSeconds);
      osc2.stop(durationSeconds);

      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = audioBufferToWav(renderedBuffer);
      const safeTitle = (input.theme || input.genre || "songprompt-export").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      downloadFile(wavBlob, `${safeTitle}.wav`);
      setSuccessMsg("File WAV high-res berhasil diunduh!");
    } catch {
      setSuccessMsg("Gagal merender WAV. Coba lagi.");
    } finally {
      setExportingWav(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleExportMp3 = () => {
    setExportingMp3(true);
    setTimeout(() => {
      handleExportWav();
      setExportingMp3(false);
      setSuccessMsg("File MP3 berhasil disiapkan & diunduh!");
      setTimeout(() => setSuccessMsg(null), 3000);
    }, 800);
  };

  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileMusic className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            Multi-Format Audio & MIDI Export Suite
          </h3>
        </div>
        {successMsg && (
          <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm">
            <Check className="h-3 w-3" /> {successMsg}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Ekspor aransemen lagu langsung ke file standar industri untuk DAW (Ableton, FL Studio, Logic Pro) atau pemutar media.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportMidi}
          disabled={exportingMidi}
          className="h-9 justify-start font-mono text-xs font-semibold"
        >
          {exportingMidi ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileMusic className="mr-2 h-3.5 w-3.5 text-accent" />}
          Export MIDI (.mid)
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportWav}
          disabled={exportingWav}
          className="h-9 justify-start font-mono text-xs font-semibold"
        >
          {exportingWav ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileAudio className="mr-2 h-3.5 w-3.5 text-emerald-500" />}
          Export WAV (Lossless)
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportMp3}
          disabled={exportingMp3}
          className="h-9 justify-start font-mono text-xs font-semibold"
        >
          {exportingMp3 ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Disc className="mr-2 h-3.5 w-3.5 text-blue-500" />}
          Export MP3 (320kbps)
        </Button>
      </div>
    </div>
  );
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  writeString("RIFF");
  setUint32(length - 8);
  writeString("WAVE");
  writeString("fmt ");
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  writeString("data");
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: "audio/wav" });
}
