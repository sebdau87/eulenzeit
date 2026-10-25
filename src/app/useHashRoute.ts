import { useSyncExternalStore } from 'react';
import { getLevel, isLevelId, type LevelId } from '../domain/levels';

/** Minimales Hash-Routing: keine Router-Bibliothek, funktioniert offline und auf jedem Static-Host. */
export type Route =
  | { name: 'levels' }
  | { name: 'level'; level: LevelId }
  | { name: 'eltern' }
  | { name: 'komponenten' };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  if (path === 'komponenten') return { name: 'komponenten' };
  if (path === 'eltern') return { name: 'eltern' };
  const match = /^level\/(\d+)$/.exec(path);
  const level = match ? Number(match[1]) : NaN;
  if (isLevelId(level)) return { name: 'level', level };
  return { name: 'levels' };
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case 'levels':
      return '#/';
    case 'level':
      return `#/level/${route.level}`;
    case 'eltern':
      return '#/eltern';
    case 'komponenten':
      return '#/komponenten';
  }
}

/** Seitentitel je Bildschirm (WCAG 2.4.2). */
export function titleFor(route: Route): string {
  switch (route.name) {
    case 'levels':
      return 'Eulenzeit';
    case 'level':
      return `Level ${route.level}: ${getLevel(route.level).title} – Eulenzeit`;
    case 'eltern':
      return 'Für Eltern – Eulenzeit';
    case 'komponenten':
      return 'Komponenten – Eulenzeit';
  }
}

export function navigate(route: Route): void {
  window.location.hash = hrefFor(route);
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

export function useHashRoute(): Route {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => '',
  );
  return parseRoute(hash);
}
