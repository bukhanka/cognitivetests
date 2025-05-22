"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ScooterReadinessTestResults } from '@/hooks/useScooterReadinessGame';

// Dynamic import to ensure it only loads on client
const ScooterReadinessTest = dynamic(
  () => import('@/components/tests/ScooterReadinessTest'),
  { ssr: false }
);

export default function ScooterReadinessPage() {
  const [testCompleted, setTestCompleted] = useState(false);
  const [results, setResults] = useState<ScooterReadinessTestResults | null>(null);
  const router = useRouter();

  const handleTestComplete = (testResults: ScooterReadinessTestResults) => {
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
      <h1 className="text-3xl font-bold mb-6 text-center">
        Тест готовности к управлению самокатом
      </h1>

      {!testCompleted ? (
        <ScooterReadinessTest onComplete={handleTestComplete} />
      ) : (
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-4">Тест завершен!</h2>
          <p className="mb-2">Переход к результатам...</p>
          {results && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg inline-block">
              <p>Точность: {Math.round(results.accuracy * 100)}%</p>
              <p>Среднее время реакции: {results.averageReactionTime ? 
                `${Math.round(results.averageReactionTime)}мс` : 
                'Не определено'}</p>
              <p>Рекомендация: {results.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 