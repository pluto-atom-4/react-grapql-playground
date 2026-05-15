import { ReactElement, ReactNode } from 'react';
import { MockedProvider, type MockedProviderProps } from '@apollo/client/testing/react';

/**
 * Test utility to wrap components with MockedProvider
 * Handles Apollo Client setup for component testing
 */
export function createApolloWrapper(
  mocks: MockedProviderProps['mocks'] = [],
): (props: { children: ReactNode }) => ReactElement {
  return function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <MockedProvider mocks={mocks} addTypename={true}>
        {children}
      </MockedProvider>
    );
  };
}

/**
 * Test utility to render components with Apollo wrapper
 * Usage: const { getByText } = renderWithApollo(<Component />, mocks);
 */
export function renderWithApollo(
  ui: ReactElement,
  mocks: MockedProviderProps['mocks'] = [],
) {
  const { render } = require('@testing-library/react');
  const wrapper = createApolloWrapper(mocks);
  return render(ui, { wrapper });
}
