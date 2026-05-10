// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import Home from '~/routes/home';

describe('Landing Page', () => {
  const Stub = createRoutesStub([
    { path: '/', Component: Home },
    { path: '/auth', Component: () => <div>Auth Page</div> },
    { path: '/privacy', Component: () => <div>Privacy Page</div> },
  ]);

  it('renders navigation with logo', () => {
    render(<Stub initialEntries={['/']} />);
    expect(screen.getAllByText('Sent').length).toBeGreaterThanOrEqual(1);
  });

  it('renders hero headline', () => {
    render(<Stub initialEntries={['/']} />);
    expect(screen.getByText('Recover Abandoned Carts via WhatsApp')).toBeInTheDocument();
  });

  it('renders hero subheadline', () => {
    render(<Stub initialEntries={['/']} />);
    expect(screen.getByText(/Automatically send WhatsApp messages to recover lost sales/)).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    render(<Stub initialEntries={['/']} />);
    expect(screen.getByText('Get Started Free')).toBeInTheDocument();
    expect(screen.getByText('View Documentation')).toBeInTheDocument();
  });

  it('renders all 3 features', () => {
    render(<Stub initialEntries={['/']} />);
    expect(screen.getByText('Abandoned Cart Recovery')).toBeInTheDocument();
    expect(screen.getByText('Order Confirmations')).toBeInTheDocument();
    expect(screen.getByText('ROI Tracking')).toBeInTheDocument();
  });

  it('renders How It Works section with 3 steps', () => {
    render(<Stub initialEntries={['/']} />);
    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getByText('Connect your Shopify store')).toBeInTheDocument();
    expect(screen.getByText('Configure Twilio WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Start recovering sales')).toBeInTheDocument();
  });

  it('renders Pricing section', () => {
    render(<Stub initialEntries={['/']} />);
    expect(screen.getByText('Simple pricing')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('200 messages/month')).toBeInTheDocument();
  });

  it('renders Footer with links', () => {
    render(<Stub initialEntries={['/']} />);
    expect(screen.getAllByText('Sent').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Docs').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('GitHub').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Privacy')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Stub initialEntries={['/']} />);
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getAllByText('Docs').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('GitHub').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Add to Shopify button in navigation', () => {
    render(<Stub initialEntries={['/']} />);
    expect(screen.getAllByText('Add to Shopify').length).toBeGreaterThanOrEqual(1);
  });
});
