"use client";

import { useCallback } from "react";
import TestPageLayout from "@/components/layout/TestPageLayout";
import ScooterReadinessTest from "@/components/tests/ScooterReadinessTest";
import { useTestResults } from "@/context/TestResultsContext";
import { ScooterReadinessResult } from "@/types";
import { getTestConfigById } from "@/app/tests/testConfig";
import { GameConfig } from "@/hooks/useScooterReadinessGame";

const TEST_ID = "scooter-readiness";

// Updated Urent colors matching the new purple theme
const urentColors = {
  primary: '#7e21cd', // Main purple
  primaryLight: '#b06ae9', // Lighter purple
  primaryDark: '#5f0f9f', // Darker purple
  secondary: '#fc0065', // MTS accent color
  accent: '#fc0065', // MTS accent color
  safe: '#00c853',
  warning: '#ffc107',
  danger: '#ff3d00',
  background: '#f7e5ff', // Light purple background
  cardBackground: '#FFFFFF',
  darkText: '#171717',
  lightText: '#FFFFFF',
};

// Настройки игры для этой страницы
const gameConfig: Partial<GameConfig> = {
  testDuration: 10, // Длительность теста в секундах
  totalElements: 15, // Общее количество элементов
  tapProbability: 0.7, // 70% элементов будут 'tap'
  reactionTimeThreshold: 1500, // Порог для времени реакции (мс)
  accuracyThreshold: 75, // Порог для точности (%)
  decisionScoreThreshold: 50, // Порог для принятия решений (%)
};

// The additionalInfo JSX updated with new styles to match screenshot
const additionalInfoScooter = (
  <div className="mt-8 p-6">
    <h3 className="text-2xl font-bold mb-4" style={{ color: '#7e21cd' }}>
      Как работает оценка?
    </h3>
    
    <p className="mb-5">
      Тест измеряет три ключевых показателя вашей готовности к безопасной поездке:
    </p>
    
    <div className="space-y-6">
      <div className="flex items-start">
        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4"
             style={{ backgroundColor: '#7e21cd' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-xl" style={{color: '#7e21cd'}}>Время реакции</h4>
          <p>Скорость, с которой вы отвечаете на визуальные стимулы</p>
        </div>
      </div>
      
      <div className="flex items-start">
        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4"
             style={{ backgroundColor: '#7e21cd' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-xl" style={{color: '#7e21cd'}}>Точность</h4>
          <p>Способность правильно различать и реагировать на разные элементы</p>
        </div>
      </div>
      
      <div className="flex items-start">
        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4"
             style={{ backgroundColor: '#7e21cd' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-xl" style={{color: '#7e21cd'}}>Принятие решений</h4>
          <p>Эффективность управления рисками в условиях быстрой смены событий</p>
        </div>
      </div>
    </div>
  </div>
);

export default function ScooterReadinessPage() {
  const { addResult } = useTestResults();

  const testConfig = getTestConfigById(TEST_ID);

  // Define the type for the test results outside of the conditional
  type ScooterReadinessTestResults = {
    averageReactionTime: number;
    accuracy: number;
    decisionScore: number;
    recommendation: string;
    suggestedSpeed?: number;
    safetyTip?: string;
  };
  
  // Используем useCallback для предотвращения повторных рендеров и вызовов - moved outside conditional
  const handleTestComplete = useCallback((results: ScooterReadinessTestResults) => {
    if (!testConfig) return; // Exit if no test config
    
    const testResultData: ScooterReadinessResult = {
      testId: TEST_ID,
      testName: testConfig.name,
      timestamp: Date.now(),
      averageReactionTime: results.averageReactionTime,
      accuracy: results.accuracy,
      decisionScore: results.decisionScore,
      recommendation: results.recommendation,
      suggestedSpeed: results.suggestedSpeed,
      safetyTip: results.safetyTip,
    };
    addResult(testResultData);
  }, [testConfig, addResult]);

  if (!testConfig) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-[#7e21cd] mb-4">Ошибка: Конфигурация теста не найдена</h1>
        <p className="text-gray-700">Не удалось найти конфигурацию для теста с ID: {TEST_ID}</p>
      </div>
    );
  }

  const { name: TEST_NAME, instructions, instructionTitle } = testConfig;

  return (
    <TestPageLayout
      title={TEST_NAME}
      instructions={instructions}
      instructionTitle={instructionTitle}
    >
      <div className="max-w-4xl mx-auto">
        <ScooterReadinessTest 
          onComplete={handleTestComplete} 
          urentColors={urentColors}
          gameConfig={gameConfig}
        />
        {/* Render the additional info section specific to this test */}
        {additionalInfoScooter}
      </div>
    </TestPageLayout>
  );
} 