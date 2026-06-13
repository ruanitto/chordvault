import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsPanel } from '../SettingsPanel';

function renderPanel(overrides: Partial<Parameters<typeof SettingsPanel>[0]> = {}) {
  const defaults = {
    nashville: false,
    onNashvilleChange: vi.fn(),
    hideYt: false,
    onHideYtChange: vi.fn(),
    twoCol: false,
    onTwoColChange: vi.fn(),
    fontSize: 0,
    onFontChange: vi.fn(),
    onFontReset: vi.fn(),
    ...overrides,
  };
  const result = render(<SettingsPanel {...defaults} />);
  return { ...result, props: defaults };
}

describe('SettingsPanel', () => {
  it('renders the title', () => {
    renderPanel();
    expect(screen.getByText('Setlist defaults (all songs)')).toBeInTheDocument();
  });

  it('renders number notation toggle', () => {
    renderPanel();
    expect(screen.getByText('Number notation')).toBeInTheDocument();
  });

  it('calls onNashvilleChange when toggled', () => {
    const { props } = renderPanel();
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(props.onNashvilleChange).toHaveBeenCalledWith(true);
  });

  it('calls onHideYtChange when toggled', () => {
    const { props } = renderPanel();
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    expect(props.onHideYtChange).toHaveBeenCalledWith(true);
  });

  it('calls onTwoColChange when toggled', () => {
    const { props } = renderPanel();
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[2]);
    expect(props.onTwoColChange).toHaveBeenCalledWith(true);
  });

  it('calls onFontChange with -1 when A- is clicked', () => {
    const { props } = renderPanel();
    fireEvent.click(screen.getByText('A−'));
    expect(props.onFontChange).toHaveBeenCalledWith(-1);
  });

  it('calls onFontChange with 1 when A+ is clicked', () => {
    const { props } = renderPanel();
    fireEvent.click(screen.getByText('A+'));
    expect(props.onFontChange).toHaveBeenCalledWith(1);
  });

  it('calls onFontReset when reset is clicked', () => {
    const { props } = renderPanel({ fontSize: 2 });
    const resetBtn = screen.getByTitle('Reset');
    fireEvent.click(resetBtn);
    expect(props.onFontReset).toHaveBeenCalled();
  });

  it('disables reset button when fontSize is 0', () => {
    renderPanel({ fontSize: 0 });
    const resetBtn = screen.getByTitle('Reset');
    expect(resetBtn).toBeDisabled();
  });

  it('enables reset button when fontSize is not 0', () => {
    renderPanel({ fontSize: 3 });
    const resetBtn = screen.getByTitle('Reset');
    expect(resetBtn).not.toBeDisabled();
  });

  it('reflects checked state of checkboxes', () => {
    renderPanel({ nashville: true, hideYt: true, twoCol: true });
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });
});
