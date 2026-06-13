import { describe, it, expect, vi } from 'vitest';
import { formatLocalEntry, enrichLocalEntry, enrichLocalSetlistSongs } from '../setlists';
import type { LocalSetlistEntry, Song } from '../../types';

const baseSong: Song = {
  id: 1,
  title: 'Amazing Grace',
  artist: 'John Newton',
  content: '{title: Amazing Grace}\n[G]Amazing [C]grace',
  key: 'G',
  bpm: 80,
  youtube_url: 'https://youtube.com/watch?v=abc',
  visibility: 'public',
  language: 'en',
  user_id: 1,
  tags: 'worship',
  format_detected: 'chordpro',
  username: 'testuser',
  parent_id: null,
  status: 'active',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const baseLocalEntry: LocalSetlistEntry = {
  song_id: 1,
  title: 'Amazing Grace',
  artist: 'John Newton',
  transpose: 2,
  nashville: 1,
};

describe('setlists', () => {
  describe('formatLocalEntry', () => {
    it('creates a SetlistEntry with correct entry_id based on index', () => {
      const result = formatLocalEntry(baseLocalEntry, 3);
      expect(result.entry_id).toBe('local_3');
    });

    it('maps song_id, title, transpose, and nashville from the input', () => {
      const result = formatLocalEntry(baseLocalEntry, 0);
      expect(result.song_id).toBe(1);
      expect(result.title).toBe('Amazing Grace');
      expect(result.transpose).toBe(2);
      expect(result.nashville).toBe(1);
    });

    it('defaults artist to empty string when missing', () => {
      const entry = { ...baseLocalEntry, artist: '' };
      expect(formatLocalEntry(entry, 0).artist).toBe('');
    });

    it('defaults transpose and nashville to 0 when missing', () => {
      const entry = { song_id: 1, title: 'Test', artist: 'A' } as LocalSetlistEntry;
      const result = formatLocalEntry(entry, 0);
      expect(result.transpose).toBe(0);
      expect(result.nashville).toBe(0);
    });

    it('sets content to empty string and nullable fields to null', () => {
      const result = formatLocalEntry(baseLocalEntry, 0);
      expect(result.content).toBe('');
      expect(result.content_override).toBeNull();
      expect(result.font).toBeNull();
      expect(result.two_col).toBeNull();
      expect(result.bpm).toBeNull();
      expect(result.youtube_url).toBeNull();
    });

    it('sets language to en', () => {
      const result = formatLocalEntry(baseLocalEntry, 0);
      expect(result.language).toBe('en');
    });
  });

  describe('enrichLocalEntry', () => {
    it('returns null when song is null', () => {
      expect(enrichLocalEntry(baseLocalEntry, null, 0)).toBeNull();
    });

    it('enriches an entry with full song data', () => {
      const result = enrichLocalEntry(baseLocalEntry, baseSong, 5);
      expect(result).not.toBeNull();
      expect(result!.entry_id).toBe('local_5');
      expect(result!.song_id).toBe(1);
      expect(result!.title).toBe('Amazing Grace');
      expect(result!.artist).toBe('John Newton');
      expect(result!.content).toBe(baseSong.content);
      expect(result!.transpose).toBe(2);
      expect(result!.nashville).toBe(1);
      expect(result!.bpm).toBe(80);
      expect(result!.youtube_url).toBe('https://youtube.com/watch?v=abc');
      expect(result!.language).toBe('en');
    });

    it('defaults transpose and nashville to 0 via nullish coalescing', () => {
      const entry = { song_id: 1, title: 'X', artist: '' } as LocalSetlistEntry;
      const result = enrichLocalEntry(entry, baseSong, 0);
      expect(result!.transpose).toBe(0);
      expect(result!.nashville).toBe(0);
    });

    it('handles song with empty optional fields', () => {
      const song = { ...baseSong, artist: '', bpm: null, youtube_url: '', language: '' };
      const result = enrichLocalEntry(baseLocalEntry, song as Song, 0);
      expect(result!.artist).toBe('');
      expect(result!.bpm).toBeNull();
      expect(result!.youtube_url).toBeNull();
      expect(result!.language).toBe('en');
    });
  });

  describe('enrichLocalSetlistSongs', () => {
    it('fetches unique song IDs and returns enriched entries', async () => {
      const entries: LocalSetlistEntry[] = [
        { song_id: 1, title: 'A', artist: 'X', transpose: 0, nashville: 0 },
        { song_id: 2, title: 'B', artist: 'Y', transpose: 1, nashville: 0 },
      ];
      const song1 = { ...baseSong, id: 1, title: 'Song 1' };
      const song2 = { ...baseSong, id: 2, title: 'Song 2' };

      const mockApi = vi.fn().mockImplementation((_method: string, path: string) => {
        if (path.includes('/1')) return Promise.resolve(song1);
        if (path.includes('/2')) return Promise.resolve(song2);
        return Promise.reject(new Error('Not found'));
      });

      const result = await enrichLocalSetlistSongs(entries, mockApi);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Song 1');
      expect(result[1].title).toBe('Song 2');
      expect(mockApi).toHaveBeenCalledTimes(2);
    });

    it('deduplicates song IDs for API calls', async () => {
      const entries: LocalSetlistEntry[] = [
        { song_id: 1, title: 'A', artist: 'X', transpose: 0, nashville: 0 },
        { song_id: 1, title: 'A', artist: 'X', transpose: 3, nashville: 0 },
      ];
      const mockApi = vi.fn().mockResolvedValue(baseSong);

      const result = await enrichLocalSetlistSongs(entries, mockApi);
      expect(mockApi).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
    });

    it('filters out entries whose song fetch failed', async () => {
      const entries: LocalSetlistEntry[] = [
        { song_id: 1, title: 'A', artist: 'X', transpose: 0, nashville: 0 },
        { song_id: 99, title: 'B', artist: 'Y', transpose: 0, nashville: 0 },
      ];
      const mockApi = vi.fn().mockImplementation((_method: string, path: string) => {
        if (path.includes('/1')) return Promise.resolve(baseSong);
        return Promise.reject(new Error('Not found'));
      });

      const result = await enrichLocalSetlistSongs(entries, mockApi);
      expect(result).toHaveLength(1);
      expect(result[0].song_id).toBe(1);
    });

    it('returns empty array for empty entries', async () => {
      const mockApi = vi.fn();
      const result = await enrichLocalSetlistSongs([], mockApi);
      expect(result).toHaveLength(0);
      expect(mockApi).not.toHaveBeenCalled();
    });
  });
});
