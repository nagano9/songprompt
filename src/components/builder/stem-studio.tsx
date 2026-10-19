"use client";

import * as React from "react";
import { Play, Square, Volume2, VolumeX, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Track {
  id: string;
  name: string;
  volume: number; // 0 to 1
  muted: boolean;
  solo: boolean;
  color: string;
}

export function StemStudio() {
  const [tracks, setTracks] = React.useState<Track[]>([
    { id: "drums", name: "Drums / Beat", volume: 0.8, muted: false, solo: false, color: "bg-amber-500" },
    { id: "bass", name: "Bassline 808", volume: 0.7, muted: false, solo: false, color: "bg-blue-500" },
    { id: "guitar", name: "Lead Guitar / Melodic", volume: 0.9, muted: false, solo: false, color: "bg-emerald-500" },
    { id: "synth", name: "Synth Pads / Arp", volume: 0.6, muted: false, solo: false, color: "bg-purple-500" },
    { id: "vocals", name: "Lead Vocals / Chop", volume: 0.85, muted: false, solo: false, color: "bg-rose-500" },
  ]);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const toggleMute = (id: string) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, muted: !t.muted } : t));
  };

  const toggleSolo = (id: string) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, solo: !t.solo } : t));
  };

  const setVolume = (id: string, vol: number) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, volume: vol } : t));
  };

  const startPlayback = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      void audioCtxRef.current.resume();
    }
    setIsPlaying(true);

    // Simple audio loop simulation using oscillator
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    const stopTimer = setTimeout(() => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore error if already stopped
      }
      setIsPlaying(false);
    }, 5000);

    return () => clearTimeout(stopTimer);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  // Canvas visualizer animation
  React.useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const draw = () => {
      step += 0.05;
      ctx.fillStyle = "rgba(10, 10, 12, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#10b981"; // emerald wave
      ctx.beginPath();

      const sliceWidth = canvas.width / 50;
      let x = 0;

      for (let i = 0; i < 50; i++) {
        const v = Math.sin(i + step) * 25 + (Math.random() * 10);
        const y = canvas.height / 2 + v;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            Stem Studio & Multitrack Mixer
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <canvas ref={canvasRef} width={120} height={28} className="rounded bg-secondary/80 hidden sm:block" />
          {!isPlaying ? (
            <Button type="button" variant="accent" size="sm" onClick={startPlayback} className="h-7 font-mono text-xs">
              <Play className="mr-1 h-3 w-3" /> Play Preview
            </Button>
          ) : (
            <Button type="button" variant="destructive" size="sm" onClick={stopPlayback} className="h-7 font-mono text-xs">
              <Square className="mr-1 h-3 w-3" /> Stop
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Atur volume, solo, dan mute untuk setiap stem lagu (Drums, Bass, Guitar, Synth, Vocals) secara real-time.
      </p>

      <div className="space-y-2">
        {tracks.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 rounded-sm border border-border/75 bg-secondary/30 px-3 py-2">
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className={`h-2.5 w-2.5 rounded-full ${t.color}`} />
              <span className="font-mono text-xs font-semibold text-foreground truncate">{t.name}</span>
            </div>

            <div className="flex items-center gap-3 flex-1 max-w-xs">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={t.muted ? 0 : t.volume}
                onChange={(e) => setVolume(t.id, Number(e.target.value))}
                className="w-full accent-primary h-1.5"
              />
              <span className="font-mono text-[10px] text-muted-foreground w-8 text-right">
                {t.muted ? "MUTED" : `${Math.round(t.volume * 100)}%`}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={t.muted ? "destructive" : "outline"}
                size="sm"
                onClick={() => toggleMute(t.id)}
                className="h-6 px-2 font-mono text-[10px]"
              >
                {t.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />} M
              </Button>
              <Button
                type="button"
                variant={t.solo ? "accent" : "outline"}
                size="sm"
                onClick={() => toggleSolo(t.id)}
                className="h-6 px-2 font-mono text-[10px]"
              >
                S
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
