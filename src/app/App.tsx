import { lazy, Suspense, useEffect } from 'react';
import { LevelScreen } from '../screens/LevelScreen';
import { LevelSelectScreen } from '../screens/LevelSelectScreen';
import { ParentsScreen } from '../screens/ParentsScreen';
import { useLearningStore } from '../store/learningStore';
import { navigate, titleFor, useHashRoute } from './useHashRoute';

// Die Komponentenseite ist ein Entwicklungswerkzeug und wird nur bei Bedarf geladen.
const ComponentsPage = lazy(() => import('../showcase/ComponentsPage'));

export function App() {
  const route = useHashRoute();
  const progress = useLearningStore((s) => s.progress);
  const settings = useLearningStore((s) => s.settings);
  const setWordVariant = useLearningStore((s) => s.setWordVariant);
  const resetProgress = useLearningStore((s) => s.resetProgress);
  const title = titleFor(route);

  useEffect(() => {
    document.title = title;
  }, [title]);

  switch (route.name) {
    case 'komponenten':
      return (
        <Suspense fallback={null}>
          <ComponentsPage />
        </Suspense>
      );
    case 'level':
      return <LevelScreen key={route.level} level={route.level} />;
    case 'eltern':
      return (
        <ParentsScreen
          progress={progress}
          settings={settings}
          onWordVariant={setWordVariant}
          onReset={resetProgress}
          onBack={() => navigate({ name: 'levels' })}
        />
      );
    case 'levels':
      return (
        <LevelSelectScreen
          progress={progress}
          onStart={(level) => navigate({ name: 'level', level })}
          onParents={() => navigate({ name: 'eltern' })}
        />
      );
  }
}
