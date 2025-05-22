import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const SYMBOLS: string[] = [
    '/symbols/ship.svg',
    '/symbols/car.svg',
    '/symbols/scooter.svg',
    '/symbols/bike.svg',
    '/symbols/bus.svg',
    '/symbols/plane.svg',
    '/symbols/train.svg',
    '/symbols/truck.svg',
    '/symbols/van.svg',
];

interface VisualSearchTestProps {
    onComplete?: (correctCount: number) => void;
}

export default function VisualSearchTest({ onComplete }: VisualSearchTestProps) {
    const [phase, setPhase] = useState<'welcome' | 'game' | 'result'>('welcome');
    const [round, setRound] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [targetSymbol, setTargetSymbol] = useState('');
    const [gridSymbols, setGridSymbols] = useState<string[]>([]);
    const [timer, setTimer] = useState(10);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (phase === 'game' && timer > 0) {
            interval = setInterval(() => {
                setTimer((t) => t - 1);
            }, 1000);
        } else if (phase === 'game' && timer === 0) {
            setPhase('result');
        }
        return () => clearInterval(interval);
    }, [phase, timer]);

    useEffect(() => {
        if (phase === 'result' && onComplete) {
            onComplete(correctCount);
        }
    }, [phase, correctCount, onComplete]);

    const startGame = () => {
        setRound(0);
        setCorrectCount(0);
        setTimer(10);
        setPhase('game');
        generateRound();
    };

    const generateRound = () => {
        const shuffled = SYMBOLS.filter(Boolean).sort(() => 0.5 - Math.random());
        const target = shuffled[0];
        const distractors = shuffled.slice(1, 9);
        const insertIndex = Math.floor(Math.random() * 9);
        const grid = [...distractors];
        grid.splice(insertIndex, 0, target);
        setTargetSymbol(target);
        setGridSymbols(grid);
    };

    const handleChoice = (symbol: string) => {
        if (symbol === targetSymbol) {
            setCorrectCount((c) => c + 1);
        }
        if (round === 1) {
            setPhase('result');
        } else {
            setRound((r) => r + 1);
            generateRound();
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-4 py-8 sm:px-6 sm:py-12 md:px-8">
            {phase === 'welcome' && (
                <div
                    className="bg-gradient-to-b from-white to-[#6a0dad22] p-6 sm:p-10 rounded-xl w-full max-w-lg"
                >
                    <h1 className="text-base sm:text-xl text-gray-800 mb-6">
                        Внимание! Сейчас вы пройдёте тест. Наверху экрана появится картинка, вам нужно найти совпадающую среди тех, что ниже.
                    </h1>
                    <button
                        onClick={startGame}
                        className="mt-4 w-full px-6 py-3 bg-[#6a0dad] text-white rounded-full text-lg transition hover:scale-105"
                    >
                        Начать тест
                    </button>
                </div>
            )}

            {phase === 'game' && (
                <div className="w-full max-w-md">
                    <div className="mb-4 text-lg text-[#6a0dad]">Оставшееся время: {timer}</div>
                    <div className="flex justify-center mb-6">
                        {targetSymbol && (
                            <Image src={targetSymbol} alt="target" width={80} height={80} />
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 px-2 sm:px-0">
                        {gridSymbols.map((symbol, index) => (
                            <button
                                key={index}
                                onClick={() => handleChoice(symbol)}
                                className="p-2 sm:p-3 rounded-lg border hover:scale-105 transition"
                            >
                                <Image src={symbol} alt={`symbol-${index}`} width={60} height={60} />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {phase === 'result' && (
                <div
                    className="text-center px-4"
                >
                    <h2 className="text-2xl text-[#6a0dad] font-semibold mb-4">Тест завершён</h2>
                    <p className="text-lg mb-4">Верных ответов: {correctCount} из 2</p>
                    <p className="text-xl mb-4">
                        {correctCount === 2 ? '✅ Можно ехать' : '⚠️ Лучше выбрать другой транспорт'}
                    </p>
                    <button
                        onClick={() => setPhase('welcome')}
                        className="mt-2 px-5 py-2 bg-[#6a0dad] text-white rounded-full text-base transition hover:scale-105"
                    >
                        Пройти снова
                    </button>
                </div>
            )}
        </div>
    );
}