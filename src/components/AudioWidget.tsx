import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, Volume2, VolumeX, Youtube, X } from "lucide-react";

const VIDEO_ID = "9wh3Tem-vno";

export function AudioWidget() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(60);
  const [ytReady, setYtReady] = useState(false);
  const [useSynth, setUseSynth] = useState(false);
  const [modal, setModal] = useState(false);
  const synth = useRef<{ ctx: AudioContext; gain: GainNode; oscs: OscillatorNode[] } | null>(null);

  const cmd = (func: string, args: unknown[] = []) =>
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*",
    );

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (typeof e.data === "string" && e.origin.includes("youtube")) setYtReady(true);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const startSynth = () => {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = muted ? 0 : (volume / 100) * 0.15;
    gain.connect(ctx.destination);
    // Gentle Bhairavi-like drone: Sa, Pa, Sa'
    const oscs = [146.83, 220, 293.66].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 1 ? "triangle" : "sine";
      o.frequency.value = f;
      o.connect(gain);
      o.start();
      return o;
    });
    synth.current = { ctx, gain, oscs };
  };
  const stopSynth = () => {
    synth.current?.oscs.forEach((o) => o.stop());
    synth.current?.ctx.close();
    synth.current = null;
  };

  const toggle = () => {
    if (!mounted) {
      setMounted(true);
      setPlaying(true);
      // If YouTube does not respond within 6s, fall back to synth
      setTimeout(() => {
        setYtReady((ready) => {
          if (!ready) {
            setUseSynth(true);
            startSynth();
          }
          return ready;
        });
      }, 6000);
      return;
    }
    if (playing) {
      useSynth ? synth.current?.ctx.suspend() : cmd("pauseVideo");
    } else {
      useSynth ? synth.current?.ctx.resume() : cmd("playVideo");
    }
    setPlaying(!playing);
  };

  useEffect(() => {
    if (useSynth && synth.current) synth.current.gain.gain.value = muted ? 0 : (volume / 100) * 0.15;
    else {
      cmd("setVolume", [volume]);
      cmd(muted ? "mute" : "unMute");
    }
  }, [volume, muted, useSynth, ytReady]);

  useEffect(() => () => stopSynth(), []);

  return (
    <>
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-2 shadow-lg backdrop-blur">
        <Music className={`h-4 w-4 text-accent ${playing ? "animate-pulse" : ""}`} />
        <span className="hidden text-xs font-semibold sm:inline">মা — জেমস</span>
        <button onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="rounded-full bg-primary p-1.5 text-primary-foreground">
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <button onClick={() => setMuted(!muted)} aria-label="Mute" className="p-1 text-foreground">
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <input
          type="range" min={0} max={100} value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-16 accent-[var(--flag-red)] sm:w-20" aria-label="Volume"
        />
        <button onClick={() => setModal(true)} aria-label="Watch on YouTube" className="p-1 text-accent">
          <Youtube className="h-4 w-4" />
        </button>
        {useSynth && <span className="text-[10px] text-muted-foreground">সিন্থ</span>}
      </div>

      {mounted && !useSynth && (
        <iframe
          ref={iframeRef}
          title="bg-audio"
          className="pointer-events-none fixed -left-[9999px] h-px w-px"
          allow="autoplay"
          onLoad={() => {
            iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening" }), "*");
          }}
          src={`https://www.youtube.com/embed/${VIDEO_ID}?enablejsapi=1&autoplay=1&loop=1&playlist=${VIDEO_ID}&controls=0`}
        />
      )}

      {modal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/70 p-4" onClick={() => setModal(false)}>
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-card" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModal(false)} className="absolute right-2 top-2 z-10 rounded-full bg-card p-1"><X className="h-5 w-5" /></button>
            <div className="aspect-video">
              <iframe className="h-full w-full" title="Maa by James" allow="autoplay; encrypted-media" allowFullScreen
                src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1`} />
            </div>
            <div className="flex items-center justify-between p-3 text-sm">
              <span className="font-semibold">মা — নগর বাউল জেমস</span>
              <a className="text-accent underline" href={`https://www.youtube.com/watch?v=${VIDEO_ID}`} target="_blank" rel="noreferrer">YouTube-এ দেখুন</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
