"use client";

import React, { useState, useEffect } from 'react';
import { TestComponentProps } from "@/types";

const STIMULI = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const N = 2;
const TOTAL = 5;

interface NBackResult {
  correct: boolean;
}

const NBackTest: React.FC<TestComponentProps<NBackResult>> = ({ onComplete }) => {
    const [phase, setPhase] = useState<'welcome' | 'test' | 'result'>('welcome');
    const [sequence, setSequence] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showStimulus, setShowStimulus] = useState(false);
    const [answers, setAnswers] = useState<boolean[]>([]);
    const [correct, setCorrect] = useState(false);

    useEffect(() => {
        if (phase === 'test' && currentIndex < TOTAL - 1) {
            const timeout = setTimeout(() => {
                setShowStimulus(true);
                setTimeout(() => {
                    setShowStimulus(false);
                    setCurrentIndex((prev) => prev + 1);
                }, 1000);
            }, 500);
            return () => clearTimeout(timeout);
        }

        if (phase === 'test' && currentIndex === TOTAL - 1) {
            const timeout = setTimeout(() => {
                setShowStimulus(true);
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [phase, currentIndex]);

    const startTest = () => {
        const generated = Array.from({ length: TOTAL }, () => STIMULI[Math.floor(Math.random() * STIMULI.length)]);
        setSequence(generated);
        setPhase('test');
        setCurrentIndex(0);
        setAnswers([]);
    };

    const handleAnswer = (answer: boolean) => {
        const correctAnswer = sequence[TOTAL - 1] === sequence[TOTAL - 1 - N];
        setAnswers([answer === correctAnswer]);
        setCorrect(answer === correctAnswer);
        setPhase('result');
        onComplete({ correct: answer === correctAnswer });
    };

    return (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-4 bg-white rounded-lg">
            {phase === 'welcome' && (
                <div className="max-w-md">
                    <h1 className="text-2xl mb-4 bg-gradient-to-r from-white to-[#6a0dad] text-transparent bg-clip-text font-bold">
                        Внимание! Сейчас вы пройдёте тест.
                    </h1>
                    <p className="mb-6 text-gray-700">
                        Задача - определить, совпадает ли текущий стимул с тем, что был показан несколько шагов назад.
                    </p>
                    <button
                        onClick={startTest}
                        className="px-6 py-3 bg-[#7e21cd] text-white rounded-full transition-transform hover:scale-105"
                    >
                        Начать тест
                    </button>
                </div>
            )}

            {phase === 'test' && (
                <div className="text-5xl font-bold text-[#7e21cd] min-h-[80px]">
                    {showStimulus && sequence[currentIndex]}

                    {currentIndex === TOTAL - 1 && showStimulus && (
                        <div className="text-center mt-8">
                            <p className="mb-4 text-lg text-black">
                                Эта цифра совпадает с той, что была {N} шагов назад?
                            </p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => handleAnswer(true)}
                                    className="px-6 py-2 bg-[#7e21cd] text-white rounded-full hover:scale-105 transition"
                                >
                                    Да
                                </button>
                                <button
                                    onClick={() => handleAnswer(false)}
                                    className="px-6 py-2 bg-[#7e21cd] text-white rounded-full hover:scale-105 transition"
                                >
                                    Нет
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {phase === 'result' && (
                <div className="text-center">
                    <h2 className="text-2xl text-[#7e21cd] font-bold mb-4">Тест завершён</h2>
                    <p className="mb-2">Верных ответов: {answers.filter(Boolean).length} из {answers.length}</p>
                    <p className="text-xl">
                        {correct ? '✅ Можно ехать' : '⚠️ Лучше выбрать другой транспорт'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default NBackTest;