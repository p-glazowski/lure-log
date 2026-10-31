import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/auth';
import Landing from './pages/Landing';

// Render the real public components, with a known signed-out session and no API calls.
// The browser still checks the user's actual session when the app starts.
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
client.setQueryData(['session'], null);
try {
  const content = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Landing />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
  const filename = path.resolve('dist/index.html');
  const template = readFileSync(filename, 'utf8');
  if (!template.includes('<div id="root"></div>')) {
    throw new Error('Cannot prerender: expected an empty app root in the built HTML');
  }
  writeFileSync(
    filename,
    template.replace(
      '<div id="root"></div>',
      `<div id="root"><!--prerendered-home-->${content}<!--/prerendered-home--></div>`,
    ),
  );
  console.log('Prerendered the public landing page into dist/index.html');
} finally {
  client.clear();
}
