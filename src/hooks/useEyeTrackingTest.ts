import { useState, useEffect, useRef, useCallback } from "react";

// Add WebGazer to Window interface for typechecking
declare global {
  interface Window {
    webgazer?: any;
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
  const [phase, setPhase] = useState<"intro" | "calibration" | "testing" | "results">("intro");
  const [dotPosition, setDotPosition] = useState<{ x: number; y: number } | null>(null);
  const [currentDot, setCurrentDot] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [preciseHits, setPreciseHits] = useState(0);
  const [webgazerInstance, setWebgazerInstance] = useState<any>(null);
  const [webgazerReady, setWebgazerReady] = useState(false);
  const [showWebgazerVideo, setShowWebgazerVideo] = useState(false);
  const [webgazerError, setWebgazerError] = useState<string | null>(null);
  const [useFallbackMode, setUseFallbackMode] = useState(disableWebgazer);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [useForceTouch, setUseForceTouch] = useState(false); // For devices with both mouse and touch
  const [calibrationIndex, setCalibrationIndex] = useState(0);

  const testAreaRef = useRef<HTMLDivElement | null>(null);
  const dotStartTimeRef = useRef<number | null>(null);
  const testTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dotTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const calibrationPointsRef = useRef<Array<[number, number]>>([]);
  const currentDotRef = useRef<HTMLDivElement | null>(null);

  // Forward declarations
  const trackGaze = useCallback((_dotX: number, _dotY: number): void => {}, []);
  const handleDotClick = useCallback((): void => {}, []);
  let showDot: () => void;

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

  // Initialize calibration points based on test area dimensions
  const initCalibrationPoints = useCallback(() => {
    if (testAreaRef.current) {
      const { offsetWidth: width, offsetHeight: height } = testAreaRef.current;
      const margin = 50;

      const points: Array<[number, number]> = [
        [margin, margin], // top-left
        [width - margin, margin], // top-right
        [width / 2, height / 2], // center
        [margin, height - margin], // bottom-left
        [width - margin, height - margin], // bottom-right
        [width / 2, margin], // top-center
      ];
      
      calibrationPointsRef.current = points;
      console.log("Initialized calibration points:", points);
    } else {
      // Default fallback if testAreaRef isn't ready
      const width = window.innerWidth;
      const height = window.innerHeight;
      const margin = 50;
      
      const points: Array<[number, number]> = [
        [margin, margin], // top-left
        [width - margin, margin], // top-right
        [width / 2, height / 2], // center
        [margin, height - margin], // bottom-left
        [width - margin, height - margin], // bottom-right
        [width / 2, margin], // top-center
      ];
      
      calibrationPointsRef.current = points;
      console.log("Using window dimensions for calibration points:", points);
    }
  }, []);

  const startWebgazer = useCallback(async () => {
    if (typeof window !== "undefined" && !webgazerInstance && !useFallbackMode) {
      setInitializationAttempted(true);
      
      try {
        console.log("Trying to initialize webgazer...");
        if (!window.webgazer) {
          console.warn("WebGazer not found on window object. Trying again in 1 second...");
          
          // Try again after a short delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (!window.webgazer) {
            throw new Error("WebGazer is not available on window object after waiting");
          }
          console.log("WebGazer found after waiting");
        }
        
        console.log("WebGazer found, setting up...");
        
        // Store the instance first
        setWebgazerInstance(window.webgazer);
        
        // Exactly match working test.html initialization
        window.webgazer.setRegression('ridge')
               .setTracker('clmtrackr');
        
        console.log("Starting WebGazer...");
        await window.webgazer.begin();
        console.log("WebGazer started successfully!");
        
        // Configure after successful initialization like in test.html
        window.webgazer.showFaceOverlay(false);
        window.webgazer.showFaceFeedbackBox(false);
        window.webgazer.showVideo(true);
        window.webgazer.showPredictionPoints(true);
        
        setWebgazerReady(true);
        setWebgazerError(null);
      } catch (error) {
        console.error("Failed to start WebGazer:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setWebgazerError(`Eye tracking couldn't initialize: ${errorMessage}`);
        setWebgazerReady(false);
        
        // Automatically fall back to mouse/touch mode
        console.log("Enabling fallback mode due to initialization error");
        setUseFallbackMode(true);
      }
    }
  }, [webgazerInstance, useFallbackMode]);

  const getRandomPosition = useCallback(() => {
    if (testAreaRef.current) {
      const { offsetWidth, offsetHeight } = testAreaRef.current;
      // Ensure dot is fully visible within the bounds
      const x = Math.random() * (offsetWidth - dotSize - 10) + 5;
      const y = Math.random() * (offsetHeight - dotSize - 10) + 5;
      console.log(`Generated new dot position: ${x}, ${y} in area ${offsetWidth}x${offsetHeight}`);
      return { x, y };
    }
    // Default fallback position - more centered to ensure visibility
    console.log("Using fallback position since test area ref is not available");
    return { x: 100, y: 100 };
  }, [dotSize]);

  // Implementation of trackGaze - from test.html approach
  const realTrackGaze = useCallback((dotX: number, dotY: number) => {
    const check = () => {
      if (!webgazerInstance || phase !== "testing") return;
      
      webgazerInstance.getCurrentPrediction().then((pred: any) => {
        if (!pred) {
          animationFrameRef.current = requestAnimationFrame(check);
          return;
        }
        
        // Simple calculation like in test.html - don't add dotSize/2
        const dx = pred.x - dotX;
        const dy = pred.y - dotY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        console.log(`Eye position: ${pred.x}, ${pred.y}, distance: ${dist}`);
        
        if (dist < targetRadius) {
          const reactionTime = Date.now() - dotStartTimeRef.current!;
          console.log(`Gaze hit detected! Distance: ${dist}px, reaction time: ${reactionTime}ms`);
          
          setReactionTimes(prev => [...prev, reactionTime]);
          setPreciseHits(prev => prev + 1);
          
          if (currentDotRef.current && currentDotRef.current.parentNode) {
            currentDotRef.current.parentNode.removeChild(currentDotRef.current);
            currentDotRef.current = null;
          }
          
          setDotPosition(null);
          dotStartTimeRef.current = null;
          
          if (dotTimerRef.current) clearTimeout(dotTimerRef.current);
          dotTimerRef.current = setTimeout(showDot, pauseBetweenDotsMs);
          return;
        }
        
        // Continue checking if no hit detected
        animationFrameRef.current = requestAnimationFrame(check);
      });
    };
    
    // Start checking
    check();
  }, [webgazerInstance, phase, targetRadius, pauseBetweenDotsMs]);

  // Create a calibration dot (similar to test.html approach)
  const createCalibrationDot = useCallback((x: number, y: number) => {
    if (currentDotRef.current && currentDotRef.current.parentNode) {
      currentDotRef.current.parentNode.removeChild(currentDotRef.current);
    }

    const dot = document.createElement("div");
    dot.className = "calibration-dot";
    Object.assign(dot.style, {
      position: "absolute",
      width: `${dotSize}px`,
      height: `${dotSize}px`,
      left: `${x}px`,
      top: `${y}px`,
      backgroundColor: "red",
      borderRadius: "50%",
      zIndex: "1000"
    });
    
    if (testAreaRef.current) {
      testAreaRef.current.appendChild(dot);
    } else {
      document.body.appendChild(dot);
    }
    
    currentDotRef.current = dot;
    
    // Match the test.html timing - record after 1 second
    setTimeout(() => {
      if (webgazerInstance) {
        console.log(`Recording calibration point at ${x},${y}`);
        webgazerInstance.recordScreenPosition(x, y, 'click');
      }
      
      // Remove dot and advance to next calibration point
      if (dot.parentNode) {
        dot.parentNode.removeChild(dot);
      }
      
      setCalibrationIndex(prev => {
        const newIndex = prev + 1;
        
        if (newIndex < calibrationPointsRef.current.length) {
          // Move to next calibration point with same timing as test.html
          setTimeout(() => {
            const [nextX, nextY] = calibrationPointsRef.current[newIndex];
            createCalibrationDot(nextX, nextY);
          }, 700);
        } else {
          // Finished calibration, move to testing phase
          setTimeout(() => {
            console.log("Calibration complete, starting test");
            startTesting();
          }, 1000);
        }
        
        return newIndex;
      });
    }, 1000); // Match test.html timing - 1000ms
  }, [webgazerInstance, dotSize]);

  // Implementation of showDot - define first as a function then assign to showDot
  const realShowDot = () => {
    if (currentDotRef.current && currentDotRef.current.parentNode) {
      currentDotRef.current.parentNode.removeChild(currentDotRef.current);
      currentDotRef.current = null;
    }

    if (currentDot >= totalDots) {
      console.log("All dots displayed, moving to results phase");
      setPhase("results");
      return;
    }

    const pos = getRandomPosition();
    console.log(`Showing dot ${currentDot + 1}/${totalDots} at position:`, pos);
    
    const dot = document.createElement("div");
    dot.className = "test-dot";
    Object.assign(dot.style, {
      position: "absolute",
      width: `${dotSize}px`,
      height: `${dotSize}px`,
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      backgroundColor: "rgba(106, 13, 173, 0.5)",
      borderRadius: "50%",
      zIndex: "100",
      cursor: (useFallbackMode || isMobile || useForceTouch) ? "pointer" : "default",
    });
    
    // Add click handler for fallback mode
    if (useFallbackMode || isMobile || useForceTouch) {
      dot.addEventListener("click", handleDotClick);
      dot.addEventListener("touchstart", handleDotClick);
    }
    
    if (testAreaRef.current) {
      testAreaRef.current.appendChild(dot);
    } else {
      document.body.appendChild(dot);
    }
    
    currentDotRef.current = dot;
    setDotPosition(pos);
    dotStartTimeRef.current = Date.now();
    setCurrentDot(prev => prev + 1);
    
    if (!useFallbackMode && webgazerInstance) {
      // Use trackGaze without adjustments to match test.html approach
      realTrackGaze(pos.x, pos.y);
    }
  };

  // Assign to the declared variable
  showDot = realShowDot;

  // Implementation of startTesting
  const startTesting = useCallback(() => {
    setShowWebgazerVideo(false); // Ensure video is hidden once test starts
    if (webgazerInstance && !useFallbackMode) {
      // Explicitly hide all visual elements of WebGazer except prediction points
      webgazerInstance.showVideo(false);
      webgazerInstance.showPredictionPoints(true); // Keep prediction points visible
      webgazerInstance.showFaceOverlay(false);
      webgazerInstance.showFaceFeedbackBox(false);
    }
    
    console.log("Starting test in mode:", useFallbackMode ? "fallback (mouse/touch)" : "eye tracking");
    setPhase("testing");
    setCurrentDot(0);
    setReactionTimes([]);
    setPreciseHits(0);
    
    // Start the test after a short delay
    setTimeout(() => {
      showDot();
      
      // Overall test timer
      if (testTimerRef.current) clearTimeout(testTimerRef.current);
      testTimerRef.current = setTimeout(() => {
        setPhase("results");
      }, testDurationSeconds * 1000 + (totalDots * pauseBetweenDotsMs)); // Adjust duration if needed
    }, 100); // Short delay
  }, [webgazerInstance, useFallbackMode, testDurationSeconds, totalDots, pauseBetweenDotsMs]);

  // Implementation of startCalibration
  const startCalibration = useCallback(() => {
    console.log("Starting calibration sequence");
    setPhase("calibration");
    setCalibrationIndex(0);
    initCalibrationPoints();
    
    // Start with the first calibration point
    const [x, y] = calibrationPointsRef.current[0];
    createCalibrationDot(x, y);
  }, [createCalibrationDot, initCalibrationPoints]);

  // Update forward declared function with real implementation
  Object.assign(handleDotClick, useCallback(() => {
    if (dotStartTimeRef.current && (useFallbackMode || isMobile || useForceTouch)) {
      const reactionTime = Date.now() - dotStartTimeRef.current;
      console.log(`Dot clicked in fallback mode, reaction time: ${reactionTime}ms`);
      
      setReactionTimes(prev => [...prev, reactionTime]);
      setPreciseHits(prev => prev + 1);
      
      if (currentDotRef.current && currentDotRef.current.parentNode) {
        currentDotRef.current.parentNode.removeChild(currentDotRef.current);
        currentDotRef.current = null;
      }
      
      setDotPosition(null);
      dotStartTimeRef.current = null;
      
      if (dotTimerRef.current) clearTimeout(dotTimerRef.current);
      dotTimerRef.current = setTimeout(showDot, pauseBetweenDotsMs);
    }
  }, [useFallbackMode, isMobile, useForceTouch, pauseBetweenDotsMs]));

  // Update trackGaze reference with real implementation
  Object.assign(trackGaze, realTrackGaze);

  const startTest = useCallback(() => {
    if (webgazerReady && !useFallbackMode) {
      startCalibration();
    } else {
      // If using fallback mode or webgazer not ready, skip calibration
      startTesting();
    }
  }, [webgazerReady, useFallbackMode, startCalibration, startTesting]);

  const toggleCalibrationVisuals = useCallback(() => {
    if (webgazerInstance && webgazerReady && !useFallbackMode) {
      const newVisibility = !showWebgazerVideo;
      setShowWebgazerVideo(newVisibility);
    }
  }, [webgazerInstance, webgazerReady, useFallbackMode, showWebgazerVideo]);

  const enableFallbackMode = useCallback(() => {
    console.log("Enabling fallback mode (mouse/touch based)");
    setUseFallbackMode(true);
    setWebgazerError(null);
    
    // If there's a webgazer instance, clean it up
    if (webgazerInstance) {
      console.log("Ending WebGazer instance (fallback mode enabled)");
      webgazerInstance.end();
      setWebgazerInstance(null);
    }
    
    setWebgazerReady(false);
  }, [webgazerInstance]);

  // Initial attempt to start WebGazer
  useEffect(() => {
    if (phase === "intro" && !initializationAttempted && !useFallbackMode) {
      startWebgazer().catch(err => {
        console.error("Error during initial WebGazer startup:", err);
      });
    }
  }, [phase, startWebgazer, initializationAttempted, useFallbackMode]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup WebGazer when component unmounts
      if (webgazerInstance) {
        console.log("Ending WebGazer instance (cleanup)");
        webgazerInstance.end(); 
      }
      if (testTimerRef.current) clearTimeout(testTimerRef.current);
      if (dotTimerRef.current) clearTimeout(dotTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (currentDotRef.current && currentDotRef.current.parentNode) {
        currentDotRef.current.parentNode.removeChild(currentDotRef.current);
      }
    };
  }, [webgazerInstance]);

  useEffect(() => {
    // This effect manages the default visibility of WebGazer elements
    if (webgazerInstance) {
      const shouldShowCalibrationVisuals = (phase === "intro" || phase === "calibration") && webgazerReady && !useFallbackMode && showWebgazerVideo;
      
      webgazerInstance.showVideo(shouldShowCalibrationVisuals);
      webgazerInstance.showPredictionPoints(true); // Always show prediction points
      webgazerInstance.showFaceOverlay(shouldShowCalibrationVisuals);
      webgazerInstance.showFaceFeedbackBox(shouldShowCalibrationVisuals);
    }
  }, [phase, webgazerReady, webgazerInstance, useFallbackMode, showWebgazerVideo]);

  // Fallback timeout for dots
  useEffect(() => {
    if (phase === "testing" && dotPosition && (useFallbackMode || isMobile)) {
      // For fallback mode, we'll use a timeout to ensure the test progresses
      if (dotTimerRef.current) clearTimeout(dotTimerRef.current);
      dotTimerRef.current = setTimeout(() => {
        console.log("Dot timed out in fallback mode, showing next.");
        
        if (currentDotRef.current && currentDotRef.current.parentNode) {
          currentDotRef.current.parentNode.removeChild(currentDotRef.current);
          currentDotRef.current = null;
        }
        
        setDotPosition(null);
        dotStartTimeRef.current = null;
        showDot();
      }, 5000); // 5 seconds timeout per dot
    }
    
    return () => {
      if (dotTimerRef.current) clearTimeout(dotTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [phase, dotPosition, useFallbackMode, isMobile]);

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
        webgazerInstance.end();
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