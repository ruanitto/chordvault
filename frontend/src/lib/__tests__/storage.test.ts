import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredUser,
  setStoredUser,
  removeStoredUser,
  getStoredTheme,
  setStoredTheme,
  getStoredFontSize,
  setStoredFontSize,
  getLocalSetlists,
  saveLocalSetlists,
  getSetlistOverrides,
  saveSetlistOverride,
  getSessionItem,
  setSessionItem,
  removeSessionItem,
} from '../storage';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('storage', () => {
  describe('user', () => {
    it('returns null when no user is stored', () => {
      expect(getStoredUser()).toBeNull();
    });

    it('stores and retrieves a user', () => {
      const user = { id: 1, username: 'alice', role: 'user' as const, token: 'tok' };
      setStoredUser(user);
      expect(getStoredUser()).toEqual(user);
    });

    it('removes a stored user', () => {
      const user = { id: 1, username: 'alice', role: 'user' as const, token: 'tok' };
      setStoredUser(user);
      removeStoredUser();
      expect(getStoredUser()).toBeNull();
    });

    it('returns null for corrupted JSON', () => {
      localStorage.setItem('cv_user', '{bad json');
      expect(getStoredUser()).toBeNull();
    });
  });

  describe('theme', () => {
    it('defaults to dark', () => {
      expect(getStoredTheme()).toBe('dark');
    });

    it('stores and retrieves light theme', () => {
      setStoredTheme('light');
      expect(getStoredTheme()).toBe('light');
    });

    it('stores and retrieves dark theme', () => {
      setStoredTheme('dark');
      expect(getStoredTheme()).toBe('dark');
    });

    it('returns dark for unknown values', () => {
      localStorage.setItem('cv_theme', 'unknown');
      expect(getStoredTheme()).toBe('dark');
    });
  });

  describe('fontSize', () => {
    it('defaults to 0', () => {
      expect(getStoredFontSize()).toBe(0);
    });

    it('stores and retrieves a font size', () => {
      setStoredFontSize(3);
      expect(getStoredFontSize()).toBe(3);
    });

    it('returns 0 for non-numeric values', () => {
      localStorage.setItem('cv_fontsize', 'abc');
      expect(getStoredFontSize()).toBe(0);
    });
  });

  describe('localSetlists', () => {
    it('defaults to empty array', () => {
      expect(getLocalSetlists()).toEqual([]);
    });

    it('stores and retrieves setlists', () => {
      const setlists = [{ id: 'abc', name: 'My Set', entries: [] }];
      saveLocalSetlists(setlists);
      expect(getLocalSetlists()).toEqual(setlists);
    });

    it('returns empty array for corrupted JSON', () => {
      localStorage.setItem('cv_local_setlists', 'not-json');
      expect(getLocalSetlists()).toEqual([]);
    });
  });

  describe('setlistOverrides', () => {
    it('returns empty object for unknown setlist', () => {
      expect(getSetlistOverrides(999)).toEqual({});
    });

    it('saves and retrieves an override for a setlist entry', () => {
      saveSetlistOverride(1, 'entry_5', { transpose: 3, nashville: true });
      const overrides = getSetlistOverrides(1);
      expect(overrides['entry_5']).toEqual({ transpose: 3, nashville: true });
    });

    it('merges overrides for the same entry', () => {
      saveSetlistOverride(1, 'e1', { transpose: 2 });
      saveSetlistOverride(1, 'e1', { font: 14 });
      const overrides = getSetlistOverrides(1);
      expect(overrides['e1']).toEqual({ transpose: 2, font: 14 });
    });

    it('keeps overrides for different setlists separate', () => {
      saveSetlistOverride(1, 'e1', { transpose: 1 });
      saveSetlistOverride(2, 'e1', { transpose: 5 });
      expect(getSetlistOverrides(1)['e1'].transpose).toBe(1);
      expect(getSetlistOverrides(2)['e1'].transpose).toBe(5);
    });

    it('returns empty object for corrupted JSON', () => {
      localStorage.setItem('cv_setlist_overrides', '{broken');
      expect(getSetlistOverrides(1)).toEqual({});
    });
  });

  describe('session storage', () => {
    it('returns null for missing key', () => {
      expect(getSessionItem('nope')).toBeNull();
    });

    it('stores and retrieves a session item', () => {
      setSessionItem('key', 'value');
      expect(getSessionItem('key')).toBe('value');
    });

    it('removes a session item', () => {
      setSessionItem('key', 'value');
      removeSessionItem('key');
      expect(getSessionItem('key')).toBeNull();
    });
  });
});
