import Input from "./src/services/input.js";
import serviceMonitor from "./src/monitor.js";
import serviceListener from "./src/listener.js";
console.clear();
console.log("pilih service:\n1. monitor\n2. listener");
const service = Input.pilih("silakan pilih: ", ["1", "2"]);
switch (service) {
  case "1":
    await serviceMonitor();
    break;
  case "2":
    await serviceListener();
    break;
}
