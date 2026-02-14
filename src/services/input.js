import promptSync from "prompt-sync";
const prompt = promptSync();
class Input {
  static wajib(message) {
    let key;
    while (true) {
      const v = prompt(message);
      if (!v.trim()) {
        console.log("silakan masukkan terlebih dahulu!");
        continue;
      } else if (v.trim().toLowerCase() === "exit") {
        console.clear();
        console.log("program berhenti...");
        process.exit(1);
      } else {
        key = v;
        break;
      }
    }
    console.clear();
    return key.trim();
  }
  static pilih(message, opsi) {
    let key;
    while (true) {
      const v = prompt(message);
      if (v && opsi.includes(v.trim())) {
        key = v;
        break;
      } else if (v.trim().toLowerCase() === "exit") {
        console.clear();
        console.log("program berhenti...");
        process.exit(1);
      } else {
        console.log(`Pilih antara ${opsi.join("/")} silahkan!`);
      }
    }
    console.clear();
    return key.trim().toLowerCase();
  }
  static biasa(message) {
    const key = prompt(message);
    if (key.trim().toLowerCase() === "exit") {
      console.clear();
      console.log("program berhenti...");
      process.exit(1);
    }
    console.clear();
    return key.trim();
  }
}
export default Input;
