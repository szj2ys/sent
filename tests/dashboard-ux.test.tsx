// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import Dashboard from '~/routes/dashboard';

describe('Dashboard UX Polish', () => {
  const mockLoaderData = {
    shop: { id: 'shop-1', domain: 'test-store.myshopify.com' },
    stats: {
      messagesSentThisMonth: 0,
      messagesDelivered: 0,
      remainingQuota: 200,
      deliveryRate: 0,
      clickThroughRate: 0,
      totalRecoveredOrders: 0,
      totalRecoveredRevenue: 0,
    },
    messages: [],
    settings: {
      enableAbandonedCart: false,
      enableOrderConfirmation: false,
    },
  };

  const Stub = createRoutesStub([
    {
      path: '/dashboard',
      Component: Dashboard,
      loader: () => mockLoaderData,
      action: () => ({ success: true }),
    },
  ]);

  describe('Onboarding Checklist', () => {
    it('renders onboarding checklist for new users', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      expect(screen.getByText('Get Started')).toBeInTheDocument();
      expect(screen.getByText('Connect Twilio account')).toBeInTheDocument();
      expect(screen.getByText('Enable abandoned cart recovery')).toBeInTheDocument();
      expect(screen.getByText('Send test message')).toBeInTheDocument();
      expect(screen.getByText('View documentation')).toBeInTheDocument();
    });

    it('shows progress indicator on checklist', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      expect(screen.getByText(/0\s*\/\s*4\s*completed/i)).toBeInTheDocument();
    });

    it('can be dismissed', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      const dismissButton = screen.getByLabelText(/dismiss.*checklist/i);
      fireEvent.click(dismissButton);
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
    });
  });

  describe('Enhanced Empty States', () => {
    it('shows friendly empty state message with icon', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      expect(screen.getByText(/No messages yet!/)).toBeInTheDocument();
      expect(screen.getByText(/Once you start recovering carts/)).toBeInTheDocument();
    });

    it('shows View Setup Guide CTA in empty state', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      expect(screen.getByText('View Setup Guide')).toBeInTheDocument();
    });
  });

  describe('Tooltips for Metrics', () => {
    it('has tooltip for Delivery Rate', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      const deliveryRateTooltip = screen.getByTitle(/percentage of messages successfully delivered/i);
      expect(deliveryRateTooltip).toBeInTheDocument();
    });

    it('has tooltip for Click-Through Rate', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      const ctrTooltip = screen.getByTitle(/percentage of messages that led to clicks/i);
      expect(ctrTooltip).toBeInTheDocument();
    });

    it('has tooltip for Recovered Revenue', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      const revenueTooltip = screen.getByTitle(/total revenue from recovered carts/i);
      expect(revenueTooltip).toBeInTheDocument();
    });
  });

  describe('Settings UI', () => {
    it('shows icons for feature toggles', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      const featureSection = screen.getByText('Abandoned Cart Recovery').closest('div');
      expect(featureSection).not.toBeNull();
    });

    it('shows enabled/disabled status indicators', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      expect(screen.getByText(/disabled/i)).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('renders stats grid with responsive classes', () => {
      const { container } = render(<Stub initialEntries={['/dashboard']} />);
      const statsSection = container.querySelector('[class*="grid"]');
      expect(statsSection).toBeInTheDocument();
    });

    it('has scrollable message table', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      const tableContainer = screen.getByRole('region', { name: /message history/i }) || 
        document.querySelector('.overflow-x-auto');
      expect(tableContainer).toBeInTheDocument();
    });
  });
});
