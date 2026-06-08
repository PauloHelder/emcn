/// <reference types="vitest" />
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import App from './App';

describe('App Component', () => {
  it('should render the LandingPage by default', async () => {
    render(<App />);
    
    // Verifica se o título principal do Hero na LandingPage é exibido
    const heroTitle = await screen.findByText(/Capacitando/i);
    expect(heroTitle).toBeInTheDocument();
    
    // Verifica se o texto sobre "Líderes Reais" também está presente
    const subtitle = screen.getByText(/Líderes Reais/i);
    expect(subtitle).toBeInTheDocument();
  });
});
