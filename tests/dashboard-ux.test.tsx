// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      expect(screen.getByText(/0\/4/)).toBeInTheDocument();
    });

    it('can be dismissed', async () => {
      const user = userEvent.setup();
      render(<Stub initialEntries={['/dashboard']} />);
      const dismissButton = screen.getByLabelText(/dismiss/i);
      await user.click(dismissButton);
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
    });
  });

  describe('Enhanced Empty States', () => {
    it('shows friendly empty state message with icon', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      expect(screen.getByText(/No messages yet/)).toBeInTheDocument();
      expect(screen.getByText(/Once you start recovering carts/)).toBeInTheDocument();
    });

    it('shows Setup Guide CTA in empty state', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      expect(screen.getByText('Setup Guide')).toBeInTheDocument();
    });
  });

  describe('Tooltips for Metrics', () => {
    it('has tooltip for Delivery Rate', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      const tooltip = screen.getByTitle(/percentage of messages successfully delivered/i);
      expect(tooltip).toBeInTheDocument();
    });

    it('has tooltip for Recovered Revenue', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      const tooltip = screen.getByTitle(/total revenue from recovered carts/i);
      expect(tooltip).toBeInTheDocument();
    });
  });

  describe('Settings UI', () => {
    it('shows icons for feature toggles', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      expect(screen.getByText('Cart Recovery')).toBeInTheDocument();
      expect(screen.getByText('Order Confirmations')).toBeInTheDocument();
    });

    it('shows active/inactive status indicators', () => {
      render(<Stub initialEntries={['/dashboard']} />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('renders stats grid with responsive classes', () => {
      const { container } = render(<Stub initialEntries={['/dashboard']} />);
      const statsSection = container.querySelector('[class*="grid"]');
      expect(statsSection).toBeInTheDocument();
    });

    it('has scrollable message table', () => {
      const { container } = render(<Stub initialEntries={['/dashboard']} />);
      const tableContainer = container.querySelector('.overflow-x-auto');
      expect(tableContainer).toBeInTheDocument();
    });
  });
});
