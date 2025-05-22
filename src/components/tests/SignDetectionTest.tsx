"use client";

import { JSX, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TestComponentProps } from "@/types";

interface SignDetectionResult {
  reactionTime: number;
  isCorrect: boolean;
}

const SignDetectionTest: React.FC<TestComponentProps<SignDetectionResult>> = ({ onComplete }) => {
    const [state, setState] = useState<"intro" | "show" | "question" | "result">("intro");
    const [hasStopSign, setHasStopSign] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [reactionTime, setReactionTime] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (state === "show") {
            const timeout = setTimeout(() => setState("question"), 3000);
            return () => clearTimeout(timeout);
        }
    }, [state]);

    const handleStart = () => {
        setHasStopSign(Math.random() < 0.5);
        setState("show");
        setStartTime(Date.now());
    };

    const handleAnswer = (answer: boolean) => {
        const rt = Date.now() - (startTime ?? Date.now());
        const correct = answer === hasStopSign;
        setReactionTime(rt);
        setIsCorrect(correct);
        setState("result");
        onComplete({ reactionTime: rt, isCorrect: correct });
    };

    const renderModal = (content: JSX.Element) => (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-400 bg-opacity-90 z-50">
            <div className="bg-white text-center rounded-2xl shadow-xl p-6 w-full max-w-md z-10">
                {content}
            </div>
        </div>
    );

    if (state === "intro") {
        return renderModal(
            <>
                <p className="text-lg text-gray-800 mb-6">
                    Сейчас вы увидите изображение с дорожной сценой. Оно будет показано 3 секунды. 
                    Ваша задача — запомнить, был ли знак "СТОП".
                </p>
                <button 
                    onClick={handleStart} 
                    className="bg-[#7e21cd] text-white py-2 px-6 rounded-xl hover:bg-[#5f0f9f] transition"
                >
                    Готов!
                </button>
            </>
        );
    }

    if (state === "show") {
        return renderModal(
            <img
                src={hasStopSign ? "/images/scene-with-stop.jpg" : "/images/scene-without-stop.jpg"}
                alt="Дорожная сцена"
                className="w-full h-auto rounded-xl"
            />
        );
    }

    if (state === "question") {
        return renderModal(
            <>
                <p className="text-lg text-gray-800 mb-6">Был ли на изображении знак СТОП?</p>
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={() => handleAnswer(true)} 
                        className="bg-[#7e21cd] text-white py-2 px-6 rounded-xl hover:bg-[#5f0f9f] transition"
                    >
                        Да
                    </button>
                    <button 
                        onClick={() => handleAnswer(false)} 
                        className="bg-[#7e21cd] text-white py-2 px-6 rounded-xl hover:bg-[#5f0f9f] transition"
                    >
                        Нет
                    </button>
                </div>
            </>
        );
    }

    if (state === "result") {
        return renderModal(
            <>
                <h2 className="text-xl font-semibold mb-4">Результат</h2>
                <p>{isCorrect ? "✅ Ответ верный!" : "❌ Ответ неверный."}</p>
                <p>Время реакции: {reactionTime} мс</p>
                <p className={`mt-4 font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                    {isCorrect ? "Вы внимательны, можно ехать!" : "Лучше тренировать внимание"}
                </p>
                <button 
                    className="mt-6 bg-[#7e21cd] text-white py-2 px-6 rounded-xl hover:bg-[#5f0f9f] transition"
                    onClick={() => router.push("/")}
                >
                    Продолжить
                </button>
            </>
        );
    }

    return null;
};

export default SignDetectionTest;