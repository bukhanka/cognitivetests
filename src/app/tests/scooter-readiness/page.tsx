"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { EyeTrackingTestResults } from '@/hooks/useEyeTrackingTest';

// Dynamic import to ensure it only loads on client
const EyeTrackingTest = dynamic(
  () => import('@/components/tests/EyeTrackingTest'),
  { ssr: false }
);

export default function ScooterReadinessPage() {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [results, setResults] = useState<EyeTrackingTestResults | null>(null);
  const router = useRouter();

  // Manual script loading as a backup
  useEffect(() => {
    // Check if webgazer is already available 
    if (typeof window !== 'undefined' && window.webgazer) {
      console.log("WebGazer already available on window");
      setScriptLoaded(true);
      return;
    }

    // Otherwise manually load it if it hasn't been loaded yet
    if (!scriptLoaded && typeof window !== 'undefined') {
      const existingScript = document.querySelector('script[src="/webgazer.js"]');
      
      if (!existingScript) {
        console.log("Manually loading WebGazer script");
        const script = document.createElement('script');
        script.src = '/webgazer.js';
        script.async = true;
        script.onload = () => {
          console.log("WebGazer script manually loaded");
          if (window.webgazer) {
            console.log("WebGazer found on window after manual load");
            setScriptLoaded(true);
          } else {
            console.error("WebGazer still not available after manual load");
            // Continue with fallback mode
            setScriptLoaded(true);
          }
        };
        script.onerror = () => {
          console.error("Failed to load WebGazer script manually");
          // Continue with fallback mode
          setScriptLoaded(true);
        };
        document.body.appendChild(script);
      }
    }
  }, [scriptLoaded]);

  // Check if webgazer is available on window after script load
  useEffect(() => {
    if (typeof window !== 'undefined' && window.webgazer) {
      console.log("WebGazer found on window object");
      setScriptLoaded(true);
    }
  }, []);

  const handleScriptLoad = () => {
    console.log("WebGazer script loading completed");
    // Check if webgazer is available now
    if (typeof window !== 'undefined' && window.webgazer) {
      console.log("WebGazer object found on window");
      setScriptLoaded(true);
    } else {
      console.warn("Script loaded but webgazer object not found");
      // Wait a bit and check again
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.webgazer) {
          console.log("WebGazer object found after delay");
          setScriptLoaded(true);
        } else {
          console.error("WebGazer object still not available after delay");
          // Continue with fallback mode
          setScriptLoaded(true);
        }
      }, 1000);
    }
  };

  const handleScriptError = () => {
    console.error("Failed to load WebGazer script");
    // Continue anyway - the component will use fallback mode
    setScriptLoaded(true);
  };

  const handleTestComplete = (testResults: EyeTrackingTestResults) => {
    console.log("Test completed with results:", testResults);
    setResults(testResults);
    setTestCompleted(true);
    
    // Navigate to results page or show results here
    setTimeout(() => {
      router.push('/results');
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Script 
        src="/webgazer.js"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
        strategy="afterInteractive"
      />
      
      <h1 className="text-3xl font-bold mb-6 text-center">
        Тест готовности к управлению самокатом
      </h1>

      {!testCompleted ? (
        scriptLoaded ? (
          <EyeTrackingTest onComplete={handleTestComplete} />
        ) : (
          <div className="text-center py-10">
            <p>Загрузка теста...</p>
            <p className="text-sm text-gray-500 mt-2">Пожалуйста, подождите, идет загрузка компонентов отслеживания глаз</p>
          </div>
        )
      ) : (
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-4">Тест завершен!</h2>
          <p className="mb-2">Переход к результатам...</p>
          {results && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg inline-block">
              <p>Попаданий: {results.preciseHits} из {results.totalAttempts}</p>
              <p>Среднее время реакции: {results.averageReactionTime ? 
                `${Math.round(results.averageReactionTime)}мс` : 
                'Не определено'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 