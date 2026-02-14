import express from "express";
import cors from "cors";
import Input from "./services/input.js";
import fs from "fs/promises";
import path from "path";
import os from "os";
import "dotenv/config";
async function serviceListener() {
  try {
    let pathAudit1;
    let pathAudit;
    let setOrigin;
    try {
      await fs.access("history/listener.json");
      const h = JSON.parse(await fs.readFile("history/listener.json", "utf-8"));
      const confirm = Input.pilih(
        `ada history:\ndomain/ip: ${h.setOrigin}\ngunakan (y/n)? `,
        ["y", "n"],
      );
      if (confirm === "n") throw "";
      setOrigin = h.setOrigin;
      while (true) {
        const target_audit = Input.wajib(
          "masukan lokasi directory yang akan diaudit: ~/",
        );
        try {
          await fs.access(path.join(os.homedir(), target_audit));
          pathAudit1 = path.join(os.homedir(), target_audit);
          break;
        } catch {
          console.log("coba lagi direktori tidak di temukan!");
          continue;
        }
      }
      let arrAudit = pathAudit1.split("/");
      arrAudit.pop();
      pathAudit = arrAudit.join("/");
    } catch {
      setOrigin = Input.wajib("masukan domain/ip yang diizinkan request?: ");
      await fs.mkdir("history", { recursive: true });
      await fs.writeFile(
        "history/listener.json",
        JSON.stringify({ setOrigin }, null, 4),
      );
    }
    const app = express();
    app.use(
      cors({
        origin: setOrigin,
        methods: ["POST"],
        allowedHeaders: ["Content-Type", "x-key"],
      }),
    );
    app.use(express.json());
    app.use((req, res, next) => {
      try {
        const key = req.headers["x-key"];
        if (!key || key !== process.env.KEY)
          throw new Error("autentikasi tidak valid!");
        next();
      } catch (err) {
        next(err);
      }
    });
    app.post("/unlinkDir", async (req, res, next) => {
      try {
        const { p } = req.body;
        const folderName = path.basename(p);
        const L = path.join(pathAudit, p);
        let message;
        try {
          await fs.access(L);
          await fs.rm(L, { recursive: true, force: false });
          const msg = `folder ${folderName}, di directory penerima terhapus...`;
          console.log(msg);
          message = msg;
        } catch {
          message = `folder ${folderName}, pada direktori penerima tidak ada!`;
        }
        res.status(200).json({
          statusText: "success",
          message: message,
        });
      } catch (err) {
        next(err);
      }
    });
    app.post("/change", async (req, res, next) => {
      try {
        const { p, data } = req.body;
        const L = path.join(pathAudit, p);
        const fileName = path.basename(p);
        let message;
        await fs.mkdir(path.dirname(L), { recursive: true });
        await fs.writeFile(L, data);
        const msg = `file ${fileName} di directory penerima update...`;
        console.log(msg);
        message = msg;
        res.status(200).json({
          statusText: "success",
          message: message,
        });
      } catch (err) {
        next(err);
      }
    });
    app.post("/unlink", async (req, res, next) => {
      try {
        const { p } = req.body;
        const L = path.join(pathAudit, p);
        const fileName = path.basename(p);
        let message;
        try {
          await fs.access(L);
          await fs.unlink(L);
          const msg = `file ${fileName} di directory penerima terhapus...`;
          console.log(msg);
          message = msg;
        } catch {
          message = `file ${fileName}, pada direktori penerima tidak ada!`;
        }
        res.status(200).json({
          statusText: "success",
          message: message,
        });
      } catch (err) {
        next(err);
      }
    });
    app.use((err, req, res, next) => {
      console.log(err.stack);
      res.status(err.statusCode || 500).json({
        statusText: "server_error",
        message: err.message,
      });
    });
    console.clear();
    app.listen(3001, "0.0.0.0", () => console.log("server running.."));
    console.log("direktori penerima: ", pathAudit1);
    console.log("domain/ip request: ", setOrigin);
  } catch (err) {
    console.error(err.message);
  }
}
export default serviceListener;
