import "dotenv/config";
import { app } from "./app.js";
import { validateRuntimeConfiguration } from "./runtime-config.js";

const PORT = Number(process.env.PORT) || 3000;

validateRuntimeConfiguration();
app.listen(PORT, () => {
  console.log(`TokTickIT API listening on http://localhost:${PORT}`);
});
