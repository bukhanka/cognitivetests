"use client";

import React from "react";
import { TestComponentProps } from "@/types";
import { useEyeTrackingTest, EyeTrackingTestResults } from "@/hooks/useEyeTrackingTest";

// Extend TestComponentProps to specify the exact results type for onComplete
interface EyeTrackingTestProps extends TestComponentProps<EyeTrackingTestResults> {
  onComplete: (results: EyeTrackingTestResults) => void;
}

const DOT_SIZE_PX = 40;
const TARGET_RADIUS = 100;
const TEST_DURATION_SECONDS = 10;
const TOTAL_DOTS = 3;
const PAUSE_BETWEEN_DOTS_MS = 1000;

const EyeTrackingTest: React.FC<EyeTrackingTestProps> = ({ onComplete }) => {
  const {
    phase,
    dotPosition,
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
  } = useEyeTrackingTest({
    onComplete,
    dotSize: DOT_SIZE_PX,
    targetRadius: TARGET_RADIUS,
    totalDots: TOTAL_DOTS,
    testDurationSeconds: TEST_DURATION_SECONDS,
    pauseBetweenDotsMs: PAUSE_BETWEEN_DOTS_MS
  });

  // Helper function to determine the input mode text
  const getInputModeText = () => {
    if (useFallbackMode) {
      return isMobile ? 'касанием' : 'мышью';
    } else if (useForceTouch) {
      return 'касанием или мышью';
    } else {
      return 'взглядом';
    }
  };

  const renderIntro = () => (
    <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '20px',
        background: 'linear-gradient(to bottom right, #ffffff, #e6e6fa, #d8bfd8, #6a0dad)',
    }}>
      {/* WebGazer video feed for calibration */}
      {phase === "intro" && webgazerReady && !useFallbackMode && (
        <>
          <button 
            onClick={toggleCalibrationVisuals}
            style={{ marginBottom: '10px', padding: '8px 12px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
          >
            {showWebgazerVideo ? "Скрыть видео калибровки" : "Показать видео калибровки"}
          </button>
          <div style={{ marginBottom: '10px', padding: '5px 10px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }}>
            <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
              Статус трекинга глаз: <strong style={{ color: '#6a0dad' }}>Активен</strong>
            </p>
            <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
              Красная точка показывает положение вашего взгляда
            </p>
          </div>
        </>
      )}
      
      {!webgazerReady && !webgazerError && !useFallbackMode && (
        <div style={{ marginBottom: '20px' }}>
          <p>Загрузка отслеживания глаз...</p>
          <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
            Убедитесь, что вы разрешили доступ к камере в браузере.
          </p>
        </div>
      )}
      
      {webgazerError && !useFallbackMode && (
        <div style={{ marginBottom: '20px', color: '#D0021B', maxWidth: '600px' }}>
          <p>{webgazerError}</p>
          <button
            onClick={enableFallbackMode}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#F5A623',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Использовать альтернативный режим ввода
          </button>
        </div>
      )}
      
      {webgazerReady && !useFallbackMode && (
        <p style={{ marginBottom: '20px' }}>
          Откалибруйте, посмотрев на различные точки экрана. Убедитесь, что точка следует за вашим взглядом.
        </p>
      )}
      
      {(useFallbackMode || useForceTouch) && (
        <div style={{ marginBottom: '20px', backgroundColor: '#FEFED5', padding: '10px', borderRadius: '5px', maxWidth: '600px' }}>
          <p><strong>Режим тестирования с {getInputModeText()} включен.</strong></p>
          <p>Вам нужно будет {isMobile ? 'нажимать/касаться' : 'нажимать на'} появляющиеся точки.</p>
        </div>
      )}

      <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: '20px' }}>
        Внимание!
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#555', marginBottom: '30px', maxWidth: '600px' }}>
        Сейчас вы пройдёте короткий тест. На экране будут появляться неяркие точки.
        Ваша задача — максимально быстро среагировать на них {getInputModeText()}.
      </p>
      <button
        onClick={startTest}
        disabled={!webgazerReady && !useFallbackMode && !isMobile && !useForceTouch}
        style={{
          padding: '15px 30px',
          fontSize: '1.1rem',
          color: 'white',
          backgroundColor: '#6a0dad',
          border: 'none',
          borderRadius: '8px',
          cursor: (webgazerReady || useFallbackMode || isMobile || useForceTouch) ? 'pointer' : 'not-allowed',
          opacity: (webgazerReady || useFallbackMode || isMobile || useForceTouch) ? 1 : 0.7,
          transition: 'background-color 0.3s ease, transform 0.2s ease',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        }}
        onMouseOver={(e) => {
          if (webgazerReady || useFallbackMode || isMobile || useForceTouch) {
            e.currentTarget.style.backgroundColor = '#5e0b9a';
          }
        }}
        onMouseOut={(e) => {
          if (webgazerReady || useFallbackMode || isMobile || useForceTouch) {
            e.currentTarget.style.backgroundColor = '#6a0dad';
          }
        }}
        onMouseDown={(e) => {
          if (webgazerReady || useFallbackMode || isMobile || useForceTouch) {
            e.currentTarget.style.transform = 'scale(0.98)';
          }
        }}
        onMouseUp={(e) => {
          if (webgazerReady || useFallbackMode || isMobile || useForceTouch) {
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        Начать тест
      </button>
    </div>
  );

  const renderTesting = () => (
    <div
      ref={testAreaRef}
      style={{
        width: "100%",
        minHeight: "70vh", // Ensure sufficient height
        height: "calc(100vh - 200px)", // Example: viewport height minus header/footer
        position: "relative",
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "8px",
        overflow: "hidden", // Clicks outside won't register if dot is near edge
      }}
    >
      {!webgazerReady && !useFallbackMode && !isMobile && !useForceTouch && (
        <p style={{ textAlign: 'center', padding: '20px' }}>Загрузка отслеживания глаз...</p>
      )}
      
      {dotPosition && (
        <div
          style={{
            position: "absolute",
            left: `${dotPosition.x}px`,
            top: `${dotPosition.y}px`,
            width: `${dotSize}px`,
            height: `${dotSize}px`,
            backgroundColor: "rgba(106, 13, 173, 0.5)", // Purple, semi-transparent
            borderRadius: "50%",
            animation: "fadeIn 0.3s ease-out",
            cursor: useFallbackMode || isMobile || useForceTouch ? "pointer" : "default",
            zIndex: 100, // Ensure dot is on top
          }}
          onClick={handleDotClick}
          onTouchStart={handleDotClick}
        />
      )}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 0.5; transform: scale(1); }
        }
        #webgazerVideoFeed,\
        #webgazerFaceOverlay,\
        #webgazerFaceFeedbackBox {
             ${showWebgazerVideo && phase === "intro" && webgazerReady && !useFallbackMode ? '' : 'display: none !important;'}
        }
        /* Allow default prediction point to show */
        .webgazerGazeDot {
          display: block !important;
          z-index: 999 !important;
          pointer-events: none !important;
        }
        /* Style our custom dot */
        .customGazeDot {
          display: block !important;
          position: fixed !important;
          z-index: 1000 !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );

  if (phase === "intro") return renderIntro();
  if (phase === "testing") return renderTesting();
  
  // For "results" phase
  return (
    <div style={{ textAlign: 'center', padding: '20px', color: '#6a0dad' }}>
        <h2>Тест завершён</h2>
        <p>Обработка результатов...</p>
    </div>
  );
};

export default EyeTrackingTest; 