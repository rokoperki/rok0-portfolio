import { useReducer, useCallback } from 'react';
import { SECTIONS } from '@/lib/constants';

interface NavState {
  active: number;
  cursor: number;
}

type NavAction =
  | { type: 'SELECT'; index: number }
  | { type: 'SET_CURSOR'; index: number };

function navReducer(state: NavState, action: NavAction): NavState {
  switch (action.type) {
    case 'SELECT':
      return { active: action.index, cursor: action.index };
    case 'SET_CURSOR':
      return { ...state, cursor: ((action.index % SECTIONS.length) + SECTIONS.length) % SECTIONS.length };
    default:
      return state;
  }
}

export function useNavState() {
  const [state, dispatch] = useReducer(navReducer, { active: 0, cursor: 0 });

  const selectSection = useCallback((index: number) => {
    dispatch({ type: 'SELECT', index });
  }, []);

  const setCursor = useCallback((index: number) => {
    dispatch({ type: 'SET_CURSOR', index });
  }, []);

  return { active: state.active, cursor: state.cursor, selectSection, setCursor };
}
