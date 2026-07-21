import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
        />
        <title>Inn</title>
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                height: 100%;
                width: 100%;
                margin: 0;
                padding: 0;
                background: #050505;
              }
              body {
                font-family: system-ui, -apple-system, sans-serif;
                -webkit-font-smoothing: antialiased;
                overflow-x: hidden;
                overflow-y: auto;
              }
              #root {
                display: flex;
                flex-direction: column;
                height: 100%;
                min-height: 100%;
                min-height: 100dvh;
                width: 100%;
              }
              #root > div {
                flex: 1;
                display: flex;
                flex-direction: column;
                height: 100%;
                min-height: 100%;
                width: 100%;
              }
              * {
                box-sizing: border-box;
              }
              textarea, input, button {
                font: inherit;
              }
              input, textarea {
                max-width: 100%;
              }
              ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              ::-webkit-scrollbar-thumb {
                background: #333;
                border-radius: 8px;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
