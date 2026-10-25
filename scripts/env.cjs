const fs = require("node:fs");
// Keep deployment secrets and unrelated settings intact.
module.exports = function updateEnv(settings) {
  const file = ".env.local";
  let env = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  for (const [key, value] of Object.entries(settings)) {
    const pattern = new RegExp(`^${key}=.*$`, "m");
    env = pattern.test(env)
      ? env.replace(pattern, () => `${key}=${value}`)
      : `${env.trimEnd()}\n${key}=${value}\n`;
  }
  fs.writeFileSync(file, env.trimStart());
};
