import chokidar from "chokidar";
import fs from "fs/promises";
import path from "path";
import os from "os";
import Input from "./services/input.js";

import "dotenv/config";
async function serviceMonitor() {
  try {
    const opsiHttp = Input.pilih("lakukan via server(y/n)?", ["y", "n"]);
    let pathMonitor;
    let pathAudit;
    let origin;
    if (opsiHttp === "y") {
      try {
        await fs.access("history/serverYes.json");
        const serverYes = JSON.parse(
          await fs.readFile("history/serverYes.json", "utf-8"),
        );
        const confirm = Input.pilih(
          `ada history:\npathMonitor: ${serverYes.pathMonitor}\norigin: ${serverYes.origin}\ngunakan (y/n)?: `,
          ["y", "n"],
        );
        if (confirm === "n") throw "";
        pathMonitor = serverYes.pathMonitor;
        origin = serverYes.origin;
      } catch {}
    } else {
      try {
        await fs.access("history/serverNo.json");
        const serverYes = JSON.parse(
          await fs.readFile("history/serverNo.json", "utf-8"),
        );
        const confirm = Input.pilih(
          `ada history:\npathMonitor: ${serverYes.pathMonitor}\npathAudit: ${serverYes.pathAudit}\ngunakan (y/n)?: `,
          ["y", "n"],
        );
        if (confirm === "n") throw "";
        pathMonitor = serverYes.pathMonitor;
        pathAudit = serverYes.pathAudit;
      } catch {}
    }
    if (!pathMonitor) {
      while (true) {
        const target_monitor = Input.wajib(
          "masukan lokasi direktori yang akan dimonitor: ",
        );
        const p_m = path.resolve(target_monitor);
        try {
          await fs.access(p_m);
          pathMonitor = p_m;
          break;
        } catch {
          console.log("coba lagi direktori tidak di temukan!");
          continue;
        }
      }
    }
    if (opsiHttp === "n" && !pathAudit) {
      while (true) {
        const target_audit = Input.wajib(
          "masukan lokasi directory yang akan diaudit: ~/",
        );
        const p_a = path.join(os.homedir(), target_audit);
        try {
          await fs.access(p_a);
          pathAudit = p_a;
          break;
        } catch {
          console.log("coba lagi direktori tidak di temukan!");
          continue;
        }
      }
      await fs.writeFile(
        "history/serverNo.json",
        JSON.stringify({ pathMonitor, pathAudit }, null, 4),
      );
    }
    if (!origin && opsiHttp === "y") {
      origin = Input.wajib("masukan domain/ip server?: ");
      await fs.writeFile(
        "history/serverYes.json",
        JSON.stringify({ pathMonitor, origin }, null, 4),
      );
    }
    // implementasi chokidar

    const w = chokidar.watch(pathMonitor, {
      ignored: /node_modules|\.git/,
      persistent: true,
      depth: 6,
    });
    console.log("via server: ", opsiHttp === "y" ? "yes" : "no");
    console.log("sedang memonitor...");

    console.log("direktori yang dimonitor: ", pathMonitor);
    if (opsiHttp === "y") console.log("url server:. ", origin);
    if (opsiHttp === "n") console.log("direktori  penerima:. ", pathAudit);
    console.log("=======");
    // bagian event control
    const url = origin + ":3001";
    let config = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-key": process.env.KEY,
      },
      body: null,
    };
    w.on("unlinkDir", async (e) => {
      const folderName = path.basename(e);
      console.log(folderName, "di monitor terhapus...");

      let arrTarget = pathMonitor.split("/");
      const index = e.indexOf(arrTarget.pop());
      if (opsiHttp === "y") {
        const p = e.substring(index);
        config.body = JSON.stringify({ p: e.substring(index) });
        const response = await fetch(url + "/unlinkDir", config);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        console.log(result.message);
        return;
      } else {
        let arrAudit = pathAudit.split("/");
        arrAudit.pop();
        const p = path.join(arrAudit.join("/"), e.substring(index));

        try {
          await fs.access(p);
          await fs.rm(p, { recursive: true, force: false });
          console.log(`folder ${folderName} di directory penerima terhapus...`);
        } catch {
          console.log(
            `folder ${folderName}, pada direktori penerima tidak ada!`,
          );
        }
      }
    });
    w.on("change", async (e) => {
      const fileName = path.basename(e);
      console.log(fileName, "di monitor update...");
      const text = await fs.readFile(e, "utf-8");

      let arrTarget = pathMonitor.split("/");
      const index = e.indexOf(arrTarget.pop());
      if (opsiHttp === "y") {
        const p = e.substring(index);
        config.body = JSON.stringify({ p: e.substring(index), data: text });
        const response = await fetch(url + "/change", config);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        console.log(result.message);
        return;
      } else {
        let arrAudit = pathAudit.split("/");
        arrAudit.pop();
        const p = path.join(arrAudit.join("/"), e.substring(index));

        await fs.mkdir(path.dirname(p), { recursive: true });
        await fs.writeFile(p, text);

        console.log(`file ${fileName}, pada direktori penerima terupdate...`);
      }
    });

    w.on("unlink", async (e) => {
      const fileName = path.basename(e);
      console.log(fileName, "di monitor terhapus...");
      let arrTarget = pathMonitor.split("/");
      const index = e.indexOf(arrTarget.pop());

      if (opsiHttp === "y") {
        const p = e.substring(index);
        config.body = JSON.stringify({ p: e.substring(index) });
        const response = await fetch(url + "/unlink", config);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        console.log(result.message);
        return;
      } else {
        let arrAudit = pathAudit.split("/");
        arrAudit.pop();
        const p = path.join(arrAudit.join("/"), e.substring(index));
        try {
          await fs.access(p);
          await fs.unlink(p);
          console.log(`file ${fileName} di directory penerima terhapus...`);
        } catch {
          console.log(`file ${fileName}, pada direktori penerima tidak ada!`);
        }
      }
    });
  } catch (err) {
    console.error(err.message);
  }
}

export default serviceMonitor;
