// Start the site on a free port for one test file; returns the base URL getter.
//   const base = useServer();  test("...", async () => fetch(base() + "/"))
import { before, after } from "node:test";
import { server } from "../../server.mjs";

export function useServer() {
  let url = null;
  before(() => new Promise((resolve) => server.listen(0, () => {
    url = `http://localhost:${server.address().port}`;
    resolve();
  })));
  after(() => new Promise((resolve) => server.close(resolve)));
  return () => url;
}
