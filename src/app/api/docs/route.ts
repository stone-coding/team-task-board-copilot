// Swagger UI from a pinned CDN build; the integrity hashes make the browser reject any changed file.
const SWAGGER_UI = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.3";
const CSS_INTEGRITY = "sha384-Ov4/wv3j2bmct8cDc5X4ngJZohVPzEmc6uDPH8WeljUxO5vtoykvMEfbu9Vh6RaW";
const BUNDLE_INTEGRITY = "sha384-h00llMzD1afyNow1pDmnZKlHsUZgp9KE9HXLFXF2CvbwsBY0+WBO4f75SfGwvM4K";

const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Team Task Board API</title>
    <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css" integrity="${CSS_INTEGRITY}" crossorigin="anonymous" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${SWAGGER_UI}/swagger-ui-bundle.js" integrity="${BUNDLE_INTEGRITY}" crossorigin="anonymous"></script>
    <script>
      window.ui = SwaggerUIBundle({ url: "/api/docs/openapi.yaml", dom_id: "#swagger-ui" });
    </script>
  </body>
</html>
`;

/** Public, interactive documentation for /api/v1 (US5). */
export function GET() {
  return new Response(PAGE, { headers: { "content-type": "text/html; charset=utf-8" } });
}
