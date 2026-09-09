import { hashPassword } from "./auth.js";

const password = process.argv.includes("--stdin")
  ? (await readStandardInput()).replace(/[\r\n]+$/, "")
  : await readConfirmedPassword();
console.log(await hashPassword(password));

async function readConfirmedPassword() {
  const password = await readHiddenPassword("Nytt operatörslösenord: ");
  const confirmation = await readHiddenPassword("Bekräfta lösenordet: ");
  if (password !== confirmation) throw new Error("Lösenorden matchar inte");
  return password;
}

async function readStandardInput() {
  let value = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) value += chunk;
  return value;
}

function readHiddenPassword(prompt: string) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Kommandot måste köras i en interaktiv terminal");
  }
  process.stdout.write(prompt);
  process.stdin.setEncoding("utf8");
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise<string>((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      process.stdout.write("\n");
    };
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Avbrutet"));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (character === "\b" || character === "\u007f") {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };
    process.stdin.on("data", onData);
  });
}
