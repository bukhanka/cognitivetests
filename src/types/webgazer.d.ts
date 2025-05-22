interface WebGazerPrediction {
  x: number;
  y: number;
}

interface WebGazer {
  setRegression(name: string): WebGazer;
  setTracker(name: string): WebGazer;
  begin(): Promise<void>;
  end(): void;
  showVideo(show: boolean): void;
  showPredictionPoints(show: boolean): void;
  showFaceOverlay(show: boolean): void;
  showFaceFeedbackBox(show: boolean): void;
  getCurrentPrediction(): Promise<WebGazerPrediction | null>;
  recordScreenPosition(x: number, y: number, type: string): void;
  setGazeListener(listener: (data: WebGazerPrediction | null) => void): void;
  resume(): void;
  pause(): void;
}

declare global {
  interface Window {
    webgazer: WebGazer;
  }
}

export {}; 