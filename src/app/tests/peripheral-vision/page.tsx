"use client";

import TestPageLayout from "@/components/layout/TestPageLayout";
import { useTestResults } from "@/context/TestResultsContext";
import { PeripheralVisionResult } from "@/types";
import { getTestConfigById } from "@/app/tests/testConfig";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const TEST_ID = "peripheral-vision";

type TestState = "select-age" | "show-info" | "running" | "completed";
type AgeCategory = "young" | "adult" | "senior";

type Stimulus = {
    id: number;
    side: "left" | "right";
    time: number;
    reacted: boolean;
    reactionTime: number | null;
    pressedSide?: "left" | "right";
};

const thresholds: Record<AgeCategory, { maxReactionTime: number }> = {
    young: { maxReactionTime: 900 },
    adult: { maxReactionTime: 1100 },
    senior: { maxReactionTime: 1300 },
};

function generateScooters() {
    return [...Array(15)].map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 5;
        const rotate = Math.random() * 360;
        return (
            <img
                key={i}
                src="/scooters.svg"
                alt="Scooter"
                style={{
                    position: "absolute",
                    top: "-80px",
                    left: `${left}%`,
                    width: "60px",
                    height: "60px",
                    opacity: 0.6,
                    transform: `rotate(${rotate}deg)`,
                    animation: `flyDown 6s linear infinite`,
                    animationDelay: `${delay}s`,
                    pointerEvents: "none",
                }}
            />
        );
    });
}

export default function PeripheralVisionPage() {
    const { addResult } = useTestResults();
    const router = useRouter();
    const [state, setState] = useState<TestState>("select-age");
    const [category, setCategory] = useState<AgeCategory | null>(null);
    const [stimuli, setStimuli] = useState<Stimulus[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [showStimulus, setShowStimulus] = useState(false);
    const [lastPressed, setLastPressed] = useState<"left" | "right" | null>(null);
    const timeouts = useRef<NodeJS.Timeout[]>([]);

    const config = getTestConfigById(TEST_ID);
    if (!config) return <div><h1>Error: Config not found</h1></div>;
    const { name: TEST_NAME, instructions, instructionTitle } = config;

    useEffect(() => {
        if (state === "running") {
            const generated: Stimulus[] = [0, 1, 2].map((i) => ({
                id: i,
                side: Math.random() < 0.5 ? "left" : "right",
                time: 0,
                reacted: false,
                reactionTime: null,
            }));
            setStimuli(generated);
            setCurrentIndex(-1);
            let acc = 0;

            generated.forEach((stim, i) => {
                const delay = 1000 + i * 3000;
                acc = delay;
                const show = setTimeout(() => {
                    setCurrentIndex(i);
                    setShowStimulus(true);
                    generated[i].time = Date.now();

                    const hide = setTimeout(() => {
                        setShowStimulus(false);
                        if (!generated[i].reacted) {
                            generated[i].reacted = true;
                        }
                    }, 1000);
                    timeouts.current.push(hide);
                }, delay);
                timeouts.current.push(show);
            });

            const end = setTimeout(() => finishTest(generated), acc + 2000);
            timeouts.current.push(end);
        }

        return () => timeouts.current.forEach(clearTimeout);
    }, [state]);

    const handlePress = (side: "left" | "right") => {
        if (state !== "running" || currentIndex === -1 || !showStimulus || lastPressed) return;

        const stimulus = stimuli[currentIndex];
        if (!stimulus || stimulus.reacted) return;

        const rt = Date.now() - stimulus.time;

        setLastPressed(side);
        setTimeout(() => setLastPressed(null), 500);

        const updated = [...stimuli];
        updated[currentIndex] = {
            ...stimulus,
            reacted: true,
            reactionTime: rt,
            pressedSide: side,
        };
        setStimuli(updated);
    };

    const finishTest = (stimuli: Stimulus[]) => {
        const correct = stimuli.filter(s => s.pressedSide === s.side);
        const avgRT = correct.length
            ? Math.round(correct.reduce((sum, s) => sum + (s.reactionTime || 0), 0) / correct.length)
            : undefined;
        const missed = stimuli.filter(s => s.reactionTime === null);
        const passed = category && avgRT !== undefined && avgRT <= (category ? thresholds[category].maxReactionTime : 0);

        const result: PeripheralVisionResult = {
            testId: TEST_ID,
            testName: TEST_NAME,
            timestamp: Date.now(),
            averageReactionTime: avgRT,
            correctPresses: correct.length,
            missedCount: missed.length,
            reactionTimes: stimuli.map(s => ({
                time: s.reactionTime ?? 0,
                side: s.side,
                correct: s.pressedSide === s.side,
            })),
            passed: passed || false,
            ageCategory: category!,
        };

        addResult(result);
        setState("completed");
    };

    const renderModal = (content: React.ReactNode) => (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-400 bg-opacity-90 z-50 overflow-hidden">
            {generateScooters()}
            <div className="bg-white text-center rounded-2xl shadow-xl p-6 w-full max-w-md z-10">
                {content}
            </div>
            <style jsx>{`
                @keyframes flyDown {
                    0% {
                        transform: translateY(-100px) rotate(0deg);
                        opacity: 0.3;
                    }
                    100% {
                        transform: translateY(110vh) rotate(360deg);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );

    const renderTestUI = () => {
        if (state === "select-age") {
            return renderModal(
                <>
                    <h2 className="text-xl font-bold mb-4 text-purple-700">Сколько вам лет?</h2>
                    <div className="flex flex-col gap-4">
                        <button className="bg-purple-600 text-white py-2 rounded-xl" onClick={() => { setCategory("young"); setState("show-info"); }}>18–30</button>
                        <button className="bg-purple-600 text-white py-2 rounded-xl" onClick={() => { setCategory("adult"); setState("show-info"); }}>31–45</button>
                        <button className="bg-purple-600 text-white py-2 rounded-xl" onClick={() => { setCategory("senior"); setState("show-info"); }}>46+</button>
                    </div>
                </>
            );
        }

        if (state === "show-info") {
            return renderModal(
                <>
                    <p className="text-lg text-gray-800 mb-6">
                        Это тест на периферийное зрение. Видите стимул — жмите как можно быстрее соответствующую стрелку.
                    </p>
                    <button className="bg-purple-600 text-white py-2 px-6 rounded-xl" onClick={() => setState("running")}>Начать тест</button>
                </>
            );
        }

        if (state === "running") {
            return renderModal(
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-3 h-3 bg-white rounded-full mb-10" />
                    <div className="relative w-full max-w-xl h-40">
                        {showStimulus && currentIndex >= 0 && (
                            <div className={`absolute top-1/2 w-10 h-10 bg-purple-500 rounded-full opacity-70 animate-pulse transform -translate-y-1/2 ${stimuli[currentIndex].side === "left" ? "left-5" : "right-5"}`} />
                        )}
                    </div>
                    <div className="flex gap-10 mt-10">
                        <button onClick={() => handlePress("left")} className={`w-16 h-16 rounded-full border-2 text-2xl ${lastPressed === "left" ? "bg-green-200 border-green-500" : "border-purple-600"}`}>←</button>
                        <button onClick={() => handlePress("right")} className={`w-16 h-16 rounded-full border-2 text-2xl ${lastPressed === "right" ? "bg-green-200 border-green-500" : "border-purple-600"}`}>→</button>
                    </div>
                </div>
            );
        }

        if (state === "completed") {
            const correct = stimuli.filter(s => s.pressedSide === s.side);
            const avgRT = correct.length
                ? Math.round(correct.reduce((sum, s) => sum + (s.reactionTime || 0), 0) / correct.length)
                : undefined;
            const missed = stimuli.filter(s => s.reactionTime === null);
            const passed = category && avgRT !== undefined && avgRT <= (category ? thresholds[category].maxReactionTime : 0);

            return renderModal(
                <>
                    <h2 className="text-xl font-semibold mb-4">Результаты</h2>
                    <p>Замечено стимулов: {correct.length} из 3</p>
                    <p>Среднее время реакции: {avgRT || "Н/Д"} мс</p>
                    <p>Пропущено: {missed.length}</p>
                    <p className={`mt-4 font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
                        {passed ? "✅ Тест пройден! Можно ехать" : "⚠️ Рекомендуем выбрать другой транспорт"}
                    </p>
                    <button className="mt-6 bg-purple-600 text-white py-2 px-6 rounded-xl" onClick={() => router.push("/")}>Продолжить</button>
                </>
            );
        }
    };

    return (
        <TestPageLayout
            title={TEST_NAME}
            instructions={instructions}
            instructionTitle={instructionTitle}
        >
            {renderTestUI()}
        </TestPageLayout>
    );
}
