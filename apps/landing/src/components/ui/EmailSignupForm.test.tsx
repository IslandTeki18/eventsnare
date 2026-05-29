import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, beforeEach, afterEach } from 'vitest'
import { EmailSignupForm } from './EmailSignupForm'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('renders email input and submit button', () => {
  render(<EmailSignupForm />)
  expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /get early access/i })).toBeInTheDocument()
})

test('shows loading state while submitting', async () => {
  mockFetch.mockImplementation(() => new Promise(() => {}))
  const user = userEvent.setup()
  render(<EmailSignupForm />)
  await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /get early access/i }))
  expect(screen.getByRole('button')).toBeDisabled()
})

test('shows success message after successful submission', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ok: true }),
  } as Response)
  const user = userEvent.setup()
  render(<EmailSignupForm />)
  await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /get early access/i }))
  await waitFor(() => {
    expect(screen.getByText("You're on the list.")).toBeInTheDocument()
  })
})

test('shows inline error for invalid email without calling fetch', async () => {
  const user = userEvent.setup()
  render(<EmailSignupForm />)
  await user.type(screen.getByPlaceholderText('your@email.com'), 'notanemail')
  await user.click(screen.getByRole('button', { name: /get early access/i }))
  expect(screen.getByText(/valid email/i)).toBeInTheDocument()
  expect(mockFetch).not.toHaveBeenCalled()
})

test('shows error message on API failure', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: 'Failed to subscribe' }),
  } as Response)
  const user = userEvent.setup()
  render(<EmailSignupForm />)
  await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /get early access/i }))
  await waitFor(() => {
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })
})
