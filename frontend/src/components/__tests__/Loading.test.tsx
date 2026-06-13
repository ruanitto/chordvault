import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loading } from '../Loading';

vi.mock('../../context/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.loading': 'Loading…',
      };
      return translations[key] ?? key;
    },
  }),
}));

describe('Loading', () => {
  it('renders the loading text', () => {
    render(<Loading />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders the music note icon', () => {
    const { container } = render(<Loading />);
    const icon = container.querySelector('.empty-icon');
    expect(icon).not.toBeNull();
    expect(icon!.textContent).toBe('♩');
  });

  it('has the empty container class', () => {
    const { container } = render(<Loading />);
    expect(container.querySelector('.empty')).not.toBeNull();
  });
});
