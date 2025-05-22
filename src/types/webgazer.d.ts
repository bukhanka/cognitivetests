declare module 'webgazer' {
  interface WebGazer {
    setRegression(regressor: string): WebGazer;
    setGazeListener(listener: (data: GazeData | null, elapsedTime: number) => void): WebGazer;
    begin(): Promise<void>;
    resume(): WebGazer;
    pause(): WebGazer;
    stopVideo(): WebGazer;
    end(): WebGazer;
    isReady(): boolean;
    showVideo(show: boolean): WebGazer;
    showPredictionPoints(show: boolean): WebGazer;
    showFaceOverlay(show: boolean): WebGazer;
    showFaceFeedbackBox(show: boolean): WebGazer;
    getCurrentPrediction(): GazeData | null;
    getGazeListener(): ((data: GazeData | null, elapsedTime: number) => void) | null;
    // Add other methods and properties as needed based on WebGazer.js documentation
    // For example:
    // setTracker(tracker: string): WebGazer;
    // clearData(): WebGazer;
    // getTracker(): string;
    // getRegression(): string;
    // getVersion(): string;
  }

  interface GazeData {
    x: number;
    y: number;
    // Potentially other properties like eyeFeatures, pupilL, pupilR etc.
    // Add based on what you use from the data object in setGazeListener
  }

  const webgazer: WebGazer;
  export default webgazer;
} 