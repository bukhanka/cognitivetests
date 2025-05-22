// Типы для различных тестов

// Общий интерфейс для результатов тестов
export interface TestResult {
  testId: string;
  testName: string;
  timestamp: number;
  // Общие опциональные поля для всех тестов
  reactionTimes?: any; // Make this more flexible
  averageReactionTime?: number;
  passed?: boolean;
  recommendation?: string; // Для тестов, которые дают рекомендации
}

// Результат теста времени реакции
export interface ReactionTimeResult extends TestResult {
  reactionTimes: number[];
  averageTime: number;
  averageReactionTime: number;
  attempts: number[];
}

// Результат теста готовности к поездке на самокате
export interface ScooterReadinessResult extends TestResult {
  averageReactionTime: number;
  accuracy: number;
  decisionScore: number;
  recommendation: string;
  suggestedSpeed?: number;
  safetyTip?: string;
}

export interface SignDetectionResult extends TestResult {
  reactionTime: number;
  isCorrect: boolean;
  imageShown: string; // Можно добавить для отладки (например: "with-stop" | "without-stop")
}

// Результат теста отслеживания глаз
export interface EyeTrackingTestResult extends TestResult {
  totalAttempts: number;
  preciseHits: number;
  reactionTimes: number[];
  averageReactionTime: number;
  fallbackModeUsed: boolean; // Indicates if mouse was used instead of eye tracking
}

export interface VisualSearchResult extends TestResult {
  correctCount: number;
  totalRounds: number;
  recommendation: string;
}

export interface NBackTestResult extends TestResult {
  passed: boolean;
  recommendation: string;
}

// Результат теста на периферийное зрение
export interface PeripheralVisionResult extends TestResult {
  correctPresses: number;
  missedCount: number;
  ageCategory: "young" | "adult" | "senior";
  reactionTimes: Array<{
    time: number;
    side: "left" | "right";
    correct: boolean;
  }>;
}


// Union type for all possible test results
export type AnyTestResult =
  | ReactionTimeResult
  | ScooterReadinessResult
  | EyeTrackingTestResult
  | PeripheralVisionResult
  | NBackTestResult
  | SignDetectionResult
  | VisualSearchResult




// Обновляем union тип

// Props for individual test components (e.g., ReactionTimeTest, ScooterReadinessTest)
export interface TestComponentProps<T = unknown> {
  onComplete: (results: T) => void;
  // Other common props for test components can be added here
}

// Props for the page components that wrap individual tests
export interface TestPageProps {
  testId: string;
  testName: string;
  // onTestComplete: (result: AnyTestResult) => void; // This will be handled by useTestResults + TestPageLayout for now
}

// Configuration for a single test, used for listings and dynamic page generation
export interface TestConfig {
  id: string;
  name: string;
  path: string;
  description: string; // Short description for test listings
  instructionTitle?: string;
  instructions: React.ReactNode; // Detailed instructions for the test page
  // component?: React.ComponentType<TestPageProps>; // For dynamic rendering, if needed
  // resultType: string; // To map to specific result interfaces, if needed for display
}

// Тип для тестов
export interface Test {
  id: string;
  name: string;
  description: string;
  duration: string;
  path: string;
}

// Банк тестов
export const TEST_BANK: Test[] = [
  {
    id: "reaction-time",
    name: "Тест времени реакции",
    description: "Измерьте скорость вашей реакции, нажимая на появляющийся стимул",
    duration: "5-10 секунд",
    path: "/tests/reaction-time"
  },
  {
    id: "scooter-readiness",
    name: "Готовность к поездке",
    description: "Проверьте вашу концентрацию внимания перед поездкой на самокате",
    duration: "10-15 секунд",
    path: "/tests/scooter-readiness"
  },
  {
    id: "eye-tracking-test",
    name: "Тест на отслеживание взгляда",
    description: "Оценивает способность быстро обнаруживать и фокусироваться на неожиданно появляющихся стимулах",
    duration: "10-15 секунд",
    path: "/tests/eye-tracking-test"
  },
  {
    id: "peripheral-vision",
    name: "Тест на периферийное зрение",
    description: "Оценивает, насколько быстро и точно вы реагируете на стимулы, возникающие в периферическом поле зрения",
    duration: "10 секунд",
    path: "/tests/peripheral-vision"
  },
  {
    id: "nback-test",
    name: "Тест на рабочую память (N-back)",
    description: "Оценивает вашу рабочую память и способность удерживать информацию",
    duration: "15 секунд",
    path: "/tests/nback-test"
  },

  {
    id: "sign-detection",
    name: "Обнаружение знаков",
    description: "Проверяет вашу способность замечать дорожные знаки",
    duration: "10 секунд",
    path: "/tests/sign-detection"
  },

  {
    id: "visual-search",
    name: "Визуальный поиск",
    description: "Проверяет вашу способность быстро находить визуальные объекты",
    duration: "20 секунд",
    path: "/tests/visual-search"
  }
]; 