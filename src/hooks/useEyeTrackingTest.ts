import { useState, useEffect, useRef, useCallback } from "react";

// Add WebGazer to Window interface for typechecking
declare global {
  interface Window {
    webgazer?: unknown;
  }
}

// Define the specific structure of results this test will produce
export interface EyeTrackingTestResults {
  totalAttempts: number;
  preciseHits: number;
  reactionTimes: number[];
  averageReactionTime: number | null;
  fallbackModeUsed: boolean; // Indicate if fallback mode was used
}

interface UseEyeTrackingTestParams {
  onComplete: (results: EyeTrackingTestResults) => void;
  dotSize?: number;
  targetRadius?: number;
  totalDots?: number;
  testDurationSeconds?: number;
  pauseBetweenDotsMs?: number;
  disableWebgazer?: boolean; // Option to directly start in fallback mode
}

export function useEyeTrackingTest({
  onComplete,
  dotSize = 40,
  targetRadius = 100,
  totalDots = 3,
  testDurationSeconds = 10,
  pauseBetweenDotsMs = 1000,
  disableWebgazer = false,
}: UseEyeTrackingTestParams) {
  const [phase, setPhase] = useState<"intro" | "testing" | "results">("intro");
  const [dotPosition, setDotPosition] = useState<{ x: number; y: number } | null>(null);
  const [currentDot, setCurrentDot] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [preciseHits, setPreciseHits] = useState(0);
  const [webgazerInstance, setWebgazerInstance] = useState<unknown>(null);
  const [webgazerReady, setWebgazerReady] = useState(false);
  const [showWebgazerVideo, setShowWebgazerVideo] = useState(false);
  const [webgazerError, setWebgazerError] = useState<string | null>(null);
  const [useFallbackMode, setUseFallbackMode] = useState(disableWebgazer);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [useForceTouch, setUseForceTouch] = useState(false); // For devices with both mouse and touch

  const testAreaRef = useRef<HTMLDivElement | null>(null);
  const dotStartTimeRef = useRef<number | null>(null);
  const testTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dotTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile device and set fallback mode if needed
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check for touch capability
      const hasTouchScreen = (): boolean => {
        if ("maxTouchPoints" in navigator) {
          return navigator.maxTouchPoints > 0;
        } else if ("msMaxTouchPoints" in navigator) {
          return (navigator as any).msMaxTouchPoints > 0;
        } else {
          const mQ = window.matchMedia ? window.matchMedia("(pointer:coarse)") : null;
          if (mQ && mQ.media === "(pointer:coarse)") {
            return !!mQ.matches;
          } else if ('orientation' in window) {
            return true; // Deprecated but good fallback
          } else {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              (navigator as any).userAgent
            );
          }
        }
      };

      const touchScreen = hasTouchScreen();
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        (navigator as any).userAgent
      );
      
      // Set as mobile if either criterion is true
      const isMobileDevice = touchScreen || mobileUA;
      
      // Detect if the device most likely supports both mouse and touch (tablets, some laptops)
      const isHybridDevice = touchScreen && !mobileUA && window.innerWidth > 768;
      
      console.log(`Device detection: Mobile: ${isMobileDevice}, Touch: ${touchScreen}, Hybrid: ${isHybridDevice}`);
      
      setIsMobile(isMobileDevice);
      
      // For tablets and hybrid devices, don't force fallback mode, but add touch support
      if (isHybridDevice) {
        setUseForceTouch(true);
      } 
      // For pure mobile devices, enable fallback mode automatically
      else if (isMobileDevice && !useFallbackMode) {
        setUseFallbackMode(true);
        console.log("Mobile device detected, using fallback mode");
      }
    }
  }, [useFallbackMode]);

  const copyWebGazerFiles = useCallback(async () => {
    // Check if we need to copy WebGazer worker files to the public directory
    try {
      // First, check if the worker file is accessible
      const response = await fetch('/tests/ridgeWorker.mjs');
      
      if (response.ok) {
        console.log("WebGazer worker files already accessible in /tests/ directory");
        return true;
      }
      
      console.log("WebGazer worker files not found in /tests/ directory, using fallback");
      return false;
    } catch (error) {
      console.error("Error checking WebGazer worker files:", error);
      return false;
    }
  }, []);

  const startWebgazer = useCallback(async () => {
    if (typeof window !== "undefined" && !webgazerInstance && !useFallbackMode) {
      setInitializationAttempted(true);
      
      try {
        // First check if worker files are accessible
        const workersAccessible = await copyWebGazerFiles();
        
        if (!workersAccessible) {
          console.log("Using simpler regression model due to worker files unavailability");
        }
        
        console.log("Trying to import webgazer...");
        const webgazerModule = await import("webgazer");
        if (!webgazerModule || !webgazerModule.default) {
          throw new Error("WebGazer module could not be loaded");
        }
        
        const webgazer = webgazerModule.default;
        // Make webgazer instance available globally for its internal calls if that helps.
        window.webgazer = webgazer;
        console.log("WebGazer imported successfully, setting up...");
        
        // Use a simpler regression if workers aren't available
        const regressionMethod = workersAccessible ? 'threadedRidge' : 'ridge';
        console.log(`Using ${regressionMethod} regression method`);
        webgazer.setRegression(regressionMethod);

        // Explicitly configure the prediction point appearance
        const setPredictionPointStyle = () => {
          const existingPoint = document.querySelector('.webgazerGazeDot') as HTMLElement;
          if (existingPoint) {
            // Point exists, update its style
            Object.assign(existingPoint.style, {
              display: 'block',
              position: 'fixed',
              zIndex: '1000',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'red',
              opacity: '0.7',
              pointerEvents: 'none'
            });
            console.log("Existing prediction point style updated");
          } else {
            // Create a custom point if needed
            const customPoint = document.createElement('div');
            customPoint.className = 'webgazerGazeDot customGazeDot';
            Object.assign(customPoint.style, {
              display: 'block',
              position: 'fixed',
              zIndex: '1000',
              width: '20px',
              height: '20px',
              left: '0px',
              top: '0px',
              borderRadius: '50%',
              backgroundColor: 'red',
              opacity: '0.7',
              pointerEvents: 'none'
            });
            document.body.appendChild(customPoint);
            console.log("Custom prediction point created");
          }
        };
        
        // Hide video and preview by default, user can enable if needed for calibration
        webgazer.showVideo(false);
        webgazer.showPredictionPoints(true); // Always show prediction points
        webgazer.showFaceOverlay(false);
        webgazer.showFaceFeedbackBox(false);

        console.log("Starting WebGazer...");
        await webgazer.begin();
        console.log("WebGazer started successfully!");
        
        // Apply our styles after WebGazer is initialized
        setTimeout(setPredictionPointStyle, 500);
        
        // Create a global gaze listener that will update our point
        const setupGlobalGazeListener = () => {
          // Get our custom point or create it if it doesn't exist
          let customPoint = document.querySelector('.customGazeDot') as HTMLElement;
          if (!customPoint) {
            customPoint = document.createElement('div');
            customPoint.className = 'webgazerGazeDot customGazeDot';
            Object.assign(customPoint.style, {
              display: 'block',
              position: 'fixed',
              zIndex: '1000',
              width: '20px',
              height: '20px',
              left: '50%', // Start in middle of screen
              top: '50%',
              transform: 'translate(-50%, -50%)', // Center the dot
              borderRadius: '50%',
              backgroundColor: 'red',
              opacity: '0.7',
              pointerEvents: 'none',
              border: '2px solid white' // Add border for better visibility
            });
            document.body.appendChild(customPoint);
          }
          
          // Setup a global gaze listener that will keep updating our point
          webgazer.setGazeListener((data: { x: number; y: number } | null) => {
            if (data && !isNaN(data.x) && !isNaN(data.y)) {
              // Log only 5% of gaze positions to avoid console spam
              if (Math.random() < 0.05) {
                console.log(`Gaze position: x=${data.x.toFixed(1)}, y=${data.y.toFixed(1)}`);
              }
              customPoint.style.left = `${data.x - 10}px`;
              customPoint.style.top = `${data.y - 10}px`;
              customPoint.style.transform = ''; // Remove centering transform
            } else if (data) {
              console.log("Invalid gaze data received:", data);
            }
          });
          console.log("Global gaze listener setup");
        };
        
        // Setup global gaze listener after a longer delay to ensure WebGazer is fully initialized
        setTimeout(setupGlobalGazeListener, 2000);
        
        setWebgazerInstance(webgazer);
        setWebgazerReady(true);
        setWebgazerError(null);
      } catch (error) {
        console.error("Failed to start WebGazer:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setWebgazerError(`Eye tracking couldn't initialize: ${errorMessage}`);
        setWebgazerReady(false);
      }
    }
  }, [webgazerInstance, useFallbackMode, copyWebGazerFiles]);

  // Initial attempt to start WebGazer
  useEffect(() => {
    if (phase === "intro" && !initializationAttempted && !useFallbackMode) {
      startWebgazer().catch(err => {
        console.error("Error during initial WebGazer startup:", err);
      });
    }
  }, [phase, startWebgazer, initializationAttempted, useFallbackMode]);

  useEffect(() => {
    if (phase === "testing" && !webgazerReady && !useFallbackMode) {
      startWebgazer();
    }

    return () => {
      // Cleanup WebGazer when component unmounts or phase changes from testing
      if (webgazerInstance && phase !== "testing") {
        console.log("Ending WebGazer instance (cleanup)");
        (webgazerInstance as any).end(); 
      }
      if (testTimerRef.current) clearTimeout(testTimerRef.current);
      if (dotTimerRef.current) clearTimeout(dotTimerRef.current);
    };
  }, [phase, webgazerInstance, webgazerReady, startWebgazer, useFallbackMode]);

  useEffect(() => {
    // This effect manages the default visibility of WebGazer elements
    if (webgazerInstance) {
      const shouldShowCalibrationVisuals = phase === "intro" && webgazerReady && !useFallbackMode;
      
      (webgazerInstance as any).showVideo(shouldShowCalibrationVisuals);
      (webgazerInstance as any).showPredictionPoints(true);
      (webgazerInstance as any).showFaceOverlay(shouldShowCalibrationVisuals);
      (webgazerInstance as any).showFaceFeedbackBox(shouldShowCalibrationVisuals);
      setShowWebgazerVideo(shouldShowCalibrationVisuals);
    }
  }, [phase, webgazerReady, webgazerInstance, useFallbackMode]);

  const getRandomPosition = useCallback(() => {
    if (testAreaRef.current) {
      const { offsetWidth, offsetHeight } = testAreaRef.current;
      // Ensure dot is fully visible within the bounds
      const x = Math.random() * (offsetWidth - dotSize);
      const y = Math.random() * (offsetHeight - dotSize);
      console.log(`Generated new dot position: ${x}, ${y} in area ${offsetWidth}x${offsetHeight}`);
      return { x, y };
    }
    // Default fallback position - more centered to ensure visibility
    console.log("Using fallback position since test area ref is not available");
    return { x: 100, y: 100 };
  }, [dotSize]);

  const showNextDot = useCallback(() => {
    if (currentDot < totalDots) {
      const pos = getRandomPosition();
      console.log(`Showing dot ${currentDot + 1}/${totalDots} at position:`, pos);
      setDotPosition(pos);
      dotStartTimeRef.current = performance.now();
      setCurrentDot(prev => prev + 1);
    } else {
      console.log("All dots displayed, moving to results phase");
      setPhase("results");
    }
  }, [currentDot, totalDots, getRandomPosition]);

  // Handle dot click for fallback mode and touch devices
  const handleDotClick = useCallback(() => {
    if (dotStartTimeRef.current && (useFallbackMode || isMobile || useForceTouch)) {
      const reactionTime = performance.now() - dotStartTimeRef.current;
      console.log(`Dot clicked in fallback mode, reaction time: ${reactionTime}ms`);
      setReactionTimes(prev => [...prev, reactionTime]);
      setPreciseHits(prev => prev + 1);
      setDotPosition(null);
      dotStartTimeRef.current = null;
      
      if (dotTimerRef.current) clearTimeout(dotTimerRef.current);
      dotTimerRef.current = setTimeout(showNextDot, pauseBetweenDotsMs);
    }
  }, [useFallbackMode, showNextDot, isMobile, pauseBetweenDotsMs, useForceTouch]);

  useEffect(() => {
    if (phase === "testing" && webgazerReady && webgazerInstance && dotPosition && !useFallbackMode) {
      console.log("Setting up gaze listener for dot at:", dotPosition);
      
      // We'll only check for gaze hits, not update the dot position
      // as that's handled by our global gaze listener
      
      (webgazerInstance as any).resume(); // Ensure it's resumed
      
      // Create a local function to check for hits
      const checkForGazeHits = (data: { x: number; y: number }) => {
        if (data && !isNaN(data.x) && !isNaN(data.y) && dotPosition && dotStartTimeRef.current) {
          const gazeX = data.x;
          const gazeY = data.y;

          const distance = Math.sqrt(
            Math.pow(gazeX - (dotPosition.x + dotSize / 2), 2) +
            Math.pow(gazeY - (dotPosition.y + dotSize / 2), 2)
          );

          if (distance < targetRadius) {
            const reactionTime = performance.now() - dotStartTimeRef.current;
            console.log(`Gaze hit detected! Distance: ${distance}px, reaction time: ${reactionTime}ms`);
            setReactionTimes((prev) => [...prev, reactionTime]);
            setPreciseHits((prev) => prev + 1);
            setDotPosition(null); // Hide dot
            dotStartTimeRef.current = null;

            if (dotTimerRef.current) clearTimeout(dotTimerRef.current);
            dotTimerRef.current = setTimeout(showNextDot, pauseBetweenDotsMs);
          }
        }
      };
      
      // Setup a timer to check for hits periodically
      const hitCheckInterval = setInterval(() => {
        if (webgazerInstance && dotPosition) {
          // Get current gaze position
          const currentPrediction = (webgazerInstance as any).getCurrentPrediction();
          if (currentPrediction) {
            checkForGazeHits(currentPrediction);
          }
        }
      }, 100); // Check 10 times per second
      
      return () => {
        clearInterval(hitCheckInterval);
      };
    } else if (phase === "testing" && (useFallbackMode || isMobile) && dotPosition) {
      // For fallback mode, we'll use a timeout to ensure the test progresses
      if (dotTimerRef.current) clearTimeout(dotTimerRef.current);
      dotTimerRef.current = setTimeout(() => {
        console.log("Dot timed out in fallback mode, showing next.");
        setDotPosition(null);
        dotStartTimeRef.current = null;
        showNextDot();
      }, 5000); // 5 seconds timeout per dot
    }
    
    return () => {
      if (webgazerInstance && webgazerReady && !useFallbackMode) {
        // Clear the gaze listener
        (webgazerInstance as any).setGazeListener(() => {});
      }
      if (dotTimerRef.current) clearTimeout(dotTimerRef.current);
    };
  }, [phase, webgazerReady, webgazerInstance, dotPosition, showNextDot, useFallbackMode, isMobile, dotSize, targetRadius, pauseBetweenDotsMs]);

  const startTest = useCallback(() => {
    setShowWebgazerVideo(false); // Ensure video is hidden once test starts
    if (webgazerInstance && !useFallbackMode) {
      // Explicitly hide all visual elements of WebGazer except prediction points
      (webgazerInstance as any).showVideo(false);
      (webgazerInstance as any).showPredictionPoints(true); // Keep prediction points visible
      (webgazerInstance as any).showFaceOverlay(false);
      (webgazerInstance as any).showFaceFeedbackBox(false);
    }
    console.log("Starting test in mode:", useFallbackMode ? "fallback (mouse/touch)" : "eye tracking");
    setPhase("testing");
    setCurrentDot(0);
    setReactionTimes([]);
    setPreciseHits(0);
    
    // Wait a brief moment for UI to update and WebGazer to be fully ready if it was just started
    setTimeout(() => {
      showNextDot();
      // Overall test timer
      if (testTimerRef.current) clearTimeout(testTimerRef.current);
      testTimerRef.current = setTimeout(() => {
        setPhase("results");
      }, testDurationSeconds * 1000 + (totalDots * pauseBetweenDotsMs)); // Adjust duration if needed
    }, 100); // Short delay
  }, [webgazerInstance, useFallbackMode, showNextDot, testDurationSeconds, totalDots, pauseBetweenDotsMs]);

  const toggleCalibrationVisuals = useCallback(() => {
    if (webgazerInstance && webgazerReady && !useFallbackMode) {
      const newVisibility = !showWebgazerVideo;
      setShowWebgazerVideo(newVisibility);
      (webgazerInstance as any).showVideo(newVisibility);
      (webgazerInstance as any).showPredictionPoints(true); // Always keep prediction points visible
      (webgazerInstance as any).showFaceOverlay(newVisibility);
      (webgazerInstance as any).showFaceFeedbackBox(newVisibility);
    }
  }, [webgazerInstance, webgazerReady, useFallbackMode, showWebgazerVideo]);

  const enableFallbackMode = useCallback(() => {
    console.log("Enabling fallback mode (mouse/touch based)");
    setUseFallbackMode(true);
    setWebgazerError(null);
    // If there's a webgazer instance, clean it up
    if (webgazerInstance) {
      console.log("Ending WebGazer instance (fallback mode enabled)");
      (webgazerInstance as any).end();
      setWebgazerInstance(null);
    }
    setWebgazerReady(false);
  }, [webgazerInstance]);

  useEffect(() => {
    // Calculate results when phase changes to "results"
    if (phase === "results") {
      const avgTime =
        reactionTimes.length > 0
          ? reactionTimes.reduce((acc, curr) => acc + curr, 0) /
            reactionTimes.length
          : null;
      
      console.log("Test completed, sending results:", {
        totalAttempts: totalDots,
        preciseHits,
        reactionTimes,
        averageReactionTime: avgTime,
        fallbackModeUsed: useFallbackMode || isMobile
      });

      onComplete({
        totalAttempts: totalDots,
        preciseHits,
        reactionTimes,
        averageReactionTime: avgTime,
        fallbackModeUsed: useFallbackMode || isMobile
      });
      
      if (webgazerInstance && !useFallbackMode) {
        console.log("Ending WebGazer instance (results phase)");
        (webgazerInstance as any).end();
      }
    }
  }, [phase, preciseHits, reactionTimes, onComplete, webgazerInstance, useFallbackMode, isMobile, totalDots]);

  return {
    phase,
    dotPosition,
    currentDot,
    reactionTimes,
    preciseHits,
    webgazerReady,
    webgazerError,
    useFallbackMode,
    showWebgazerVideo,
    isMobile,
    useForceTouch,
    testAreaRef,
    startTest,
    enableFallbackMode,
    toggleCalibrationVisuals,
    handleDotClick,
    dotSize,
    totalDots
  };
} 