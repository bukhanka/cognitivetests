"use client";

import { useCallback } from "react";
import TestPageLayout from "@/components/layout/TestPageLayout";
import NBackTest from "@/components/tests/NBackTest";
import { useTestResults } from "@/context/TestResultsContext";
import { getTestConfigById } from "@/app/tests/testConfig";

const TEST_ID = "nback-test";

export default function NBackTestPage() {
  const { addResult } = useTestResults();
  const testConfig = getTestConfigById(TEST_ID);

  const handleTestComplete = useCallback((result: { correct: boolean }) => {
    if (!testConfig) return;
    
    const recommendation = result.correct 
      ? "Можно ехать - хорошая рабочая память" 
      : "Лучше выбрать другой транспорт - требуется больше практики";
    
    addResult({
      testId: TEST_ID,
      testName: testConfig.name,
      timestamp: Date.now(),
      recommendation,
      passed: result.correct
    });
  }, [testConfig, addResult]);

  if (!testConfig) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-[#7e21cd] mb-4">Ошибка: Конфигурация теста не найдена</h1>
        <p className="text-gray-700">Не удалось найти конфигурацию для теста с ID: {TEST_ID}</p>
      </div>
    );
  }

  return (
    <TestPageLayout
      title={testConfig.name}
      instructions={testConfig.instructions}
      instructionTitle={testConfig.instructionTitle}
    >
      <NBackTest onComplete={handleTestComplete} />
    </TestPageLayout>
  );
}