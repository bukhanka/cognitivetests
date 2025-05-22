"use client";

import { useCallback } from "react";
import TestPageLayout from "@/components/layout/TestPageLayout";
import VisualSearchTest from "@/components/tests/VisualSearchTest";
import { useTestResults } from "@/context/TestResultsContext";
import { getTestConfigById } from "@/app/tests/testConfig";

const TEST_ID = "visual-search";

export default function VisualSearchPage() {
  const { addResult } = useTestResults();
  const testConfig = getTestConfigById(TEST_ID);

  const handleTestComplete = useCallback((correctCount: number) => {
    if (!testConfig) return;
    
    const recommendation = correctCount === 2 
      ? "Отличные результаты! Можно ехать" 
      : "Рекомендуется потренировать внимание перед поездкой";
    
    addResult({
      testId: TEST_ID,
      testName: testConfig.name,
      timestamp: Date.now(),
      recommendation,
      passed: correctCount === 2
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
      <VisualSearchTest onComplete={handleTestComplete} />
    </TestPageLayout>
  );
}