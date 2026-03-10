/**
 * hooks/useScanner.ts
 * Wraps @zxing/browser to provide webcam barcode/QR scanning.
 *
 * Usage:
 *   const { videoRef, start, stop, result, error, scanning } = useScanner();
 *   // Mount <video ref={videoRef} /> in JSX, then call start() on user action.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
interface ScannerState {
  scanning: boolean;
  result: string | null;
  error: string | null;
}

export function useScanner(onResult?: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<ScannerState>({
    scanning: false,
    result: null,
    error: null,
  });

  const start = useCallback(async () => {
    if (!videoRef.current) return;
    setState({ scanning: true, result: null, error: null });

    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // Get first available camera
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (devices.length === 0) throw new Error("No camera found");

      const deviceId = devices[0].deviceId;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const code = result.getText();
            setState({ scanning: false, result: code, error: null });
            onResult?.(code);
            stop();
          } else if (err && !(err instanceof NotFoundException)) {
            console.error("[scanner] decode error:", err);
          }
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Scanner error";
      setState({ scanning: false, result: null, error: msg });
    }
  }, [onResult]);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    readerRef.current = null;
    setState((s) => ({ ...s, scanning: false }));
  }, []);

  const reset = useCallback(() => {
    stop();
    setState({ scanning: false, result: null, error: null });
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return { videoRef, start, stop, reset, ...state };
}
