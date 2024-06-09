import { render, screen } from '@testing-library/react';
import Navbar from './Navbar';

test('renders Task Manager menu item', () => {
  render(<Navbar />);
  const linkElement = screen.getByText(/Task Manager/i);
  expect(linkElement).toBeInTheDocument();
});
